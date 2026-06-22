import {
  CoinTransaction,
  CoinTransactionSource,
  CoinTransactionType,
  Prisma,
  Role,
} from "@prisma/client";
import { loadAttemptPercent } from "@/lib/attempt-score";
import { prisma } from "@/lib/prisma";
import { canManageStudentCoins } from "@/lib/auth-utils";

export const EXAM_COIN_REWARD_AMOUNT = 10;
export const EXAM_COIN_REWARD_THRESHOLD = 75;

export type ApplyCoinTransactionInput = {
  studentId: string;
  amount: number;
  type: CoinTransactionType;
  source: CoinTransactionSource;
  reason?: string | null;
  examAttemptId?: string | null;
  createdById?: string | null;
};

export type ApplyCoinTransactionResult = {
  balance: number;
  transaction: CoinTransaction;
};

export class CoinError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NOT_STUDENT"
      | "NO_PROFILE"
      | "INVALID_AMOUNT"
      | "INSUFFICIENT_BALANCE"
      | "DUPLICATE_TRANSACTION"
  ) {
    super(message);
    this.name = "CoinError";
  }
}

function resolveSignedAmount(amount: number, type: CoinTransactionType): number {
  if (!Number.isInteger(amount)) {
    throw new CoinError("Amount must be an integer", "INVALID_AMOUNT");
  }

  if (type === CoinTransactionType.MANUAL_DEDUCT) {
    if (amount <= 0) {
      throw new CoinError(
        "Deduction amount must be a positive integer",
        "INVALID_AMOUNT"
      );
    }
    return -amount;
  }

  if (amount <= 0) {
    throw new CoinError("Amount must be a positive integer", "INVALID_AMOUNT");
  }

  return amount;
}

type PrismaTx = Prisma.TransactionClient;

async function assertStudentWithProfile(tx: PrismaTx, studentId: string) {
  const user = await tx.user.findUnique({
    where: { id: studentId },
    select: {
      role: true,
      studentProfile: { select: { studentId: true, coinBalance: true } },
    },
  });

  if (!user || user.role !== Role.STUDENT) {
    throw new CoinError("Coins are only available for students", "NOT_STUDENT");
  }

  if (!user.studentProfile) {
    throw new CoinError("Student profile is required for coin operations", "NO_PROFILE");
  }

  return user.studentProfile;
}

/**
 * Atomically updates a student's coin balance and records a transaction.
 */
export async function applyCoinTransaction(
  input: ApplyCoinTransactionInput,
  tx?: PrismaTx
): Promise<ApplyCoinTransactionResult> {
  const signedAmount = resolveSignedAmount(input.amount, input.type);

  const run = async (client: PrismaTx): Promise<ApplyCoinTransactionResult> => {
    await assertStudentWithProfile(client, input.studentId);

    const updatedProfile = await client.studentProfile.update({
      where: { studentId: input.studentId },
      data: { coinBalance: { increment: signedAmount } },
      select: { coinBalance: true },
    });

    if (updatedProfile.coinBalance < 0) {
      throw new CoinError("Insufficient coin balance", "INSUFFICIENT_BALANCE");
    }

    let transaction: CoinTransaction;
    try {
      transaction = await client.coinTransaction.create({
        data: {
          studentId: input.studentId,
          amount: signedAmount,
          type: input.type,
          source: input.source,
          reason: input.reason ?? null,
          examAttemptId: input.examAttemptId ?? null,
          createdById: input.createdById ?? null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new CoinError(
          "A coin transaction already exists for this student, attempt, and type",
          "DUPLICATE_TRANSACTION"
        );
      }
      throw error;
    }

    return {
      balance: updatedProfile.coinBalance,
      transaction,
    };
  };

  if (tx) {
    return run(tx);
  }

  return prisma.$transaction(run);
}

export type ExamScoreRewardResult =
  | {
      awarded: true;
      balance: number;
      transaction: CoinTransaction;
      scorePercent: number;
    }
  | {
      awarded: false;
      reason:
        | "attempt_not_found"
        | "not_submitted"
        | "below_threshold"
        | "no_score"
        | "not_student"
        | "no_profile"
        | "already_awarded";
    };

/**
 * Awards exam score coins when a submitted attempt reaches the threshold.
 * Idempotent per attempt via DB unique constraint on (studentId, examAttemptId, type).
 */
export async function tryAwardExamScoreReward(
  attemptId: string,
  tx?: PrismaTx
): Promise<ExamScoreRewardResult> {
  const run = async (client: PrismaTx): Promise<ExamScoreRewardResult> => {
    const attempt = await client.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        status: true,
        booking: { select: { exam: { select: { title: true } } } },
        assignment: {
          select: {
            class: { select: { name: true } },
          },
        },
      },
    });

    if (!attempt) {
      return { awarded: false, reason: "attempt_not_found" };
    }

    if (attempt.status !== "SUBMITTED") {
      return { awarded: false, reason: "not_submitted" };
    }

    const scorePercent = await loadAttemptPercent(attemptId, client);
    if (scorePercent === null) {
      return { awarded: false, reason: "no_score" };
    }

    if (scorePercent < EXAM_COIN_REWARD_THRESHOLD) {
      return { awarded: false, reason: "below_threshold" };
    }

    const examLabel =
      attempt.booking?.exam?.title ??
      attempt.assignment?.class?.name ??
      "exam";
    const reason = `Exam score reward: ${scorePercent}% on "${examLabel}" (${EXAM_COIN_REWARD_THRESHOLD}%+ threshold)`;

    try {
      const result = await applyCoinTransaction(
        {
          studentId: attempt.studentId,
          amount: EXAM_COIN_REWARD_AMOUNT,
          type: CoinTransactionType.EARNED,
          source: CoinTransactionSource.EXAM_SCORE,
          reason,
          examAttemptId: attemptId,
        },
        client
      );

      return {
        awarded: true,
        balance: result.balance,
        transaction: result.transaction,
        scorePercent,
      };
    } catch (error) {
      if (error instanceof CoinError) {
        if (error.code === "DUPLICATE_TRANSACTION") {
          return { awarded: false, reason: "already_awarded" };
        }
        if (error.code === "NOT_STUDENT") {
          return { awarded: false, reason: "not_student" };
        }
        if (error.code === "NO_PROFILE") {
          return { awarded: false, reason: "no_profile" };
        }
      }
      throw error;
    }
  };

  if (tx) {
    return run(tx);
  }

  return prisma.$transaction(run);
}

export async function getStudentCoinBalance(studentId: string): Promise<number> {
  const profile = await prisma.studentProfile.findUnique({
    where: { studentId },
    select: { coinBalance: true },
  });

  return profile?.coinBalance ?? 0;
}

export type CoinHistoryRow = {
  id: string;
  amount: number;
  type: CoinTransactionType;
  source: CoinTransactionSource;
  reason: string | null;
  examAttemptId: string | null;
  createdAt: Date;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

export async function getStudentCoinHistory(
  studentId: string,
  limit = 50
): Promise<CoinHistoryRow[]> {
  return prisma.coinTransaction.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      type: true,
      source: true,
      reason: true,
      examAttemptId: true,
      createdAt: true,
      createdBy: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });
}

export async function getAttemptCoinReward(attemptId: string) {
  return prisma.coinTransaction.findFirst({
    where: {
      examAttemptId: attemptId,
      type: CoinTransactionType.EARNED,
      source: CoinTransactionSource.EXAM_SCORE,
    },
    select: {
      amount: true,
      reason: true,
      createdAt: true,
    },
  });
}

export function serializeCoinHistoryRow(row: CoinHistoryRow) {
  const name = [row.createdBy?.firstName, row.createdBy?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    id: row.id,
    amount: row.amount,
    type: row.type,
    source: row.source,
    reason: row.reason,
    examAttemptId: row.examAttemptId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy
      ? { name: name || row.createdBy.email, email: row.createdBy.email }
      : null,
  };
}

export async function assertCanManageStudentCoins(
  actor: { id: string; role: string },
  studentId: string
): Promise<void> {
  if (!canManageStudentCoins(actor.role)) {
    throw new Error("Forbidden: Coin manager access required");
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });

  if (!student || student.role !== Role.STUDENT) {
    throw new Error("Student not found");
  }

  if (actor.role === "CREATOR" || actor.role === "BOSS" || actor.role === "ADMIN") {
    return;
  }

  if (actor.role !== "TEACHER") {
    throw new Error("Forbidden: Coin manager access required");
  }

  const [assignedProfile, classEnrollment] = await Promise.all([
    prisma.studentProfile.findFirst({
      where: { studentId, teacherId: actor.id },
      select: { studentId: true },
    }),
    prisma.classStudent.findFirst({
      where: { studentId, class: { teacherId: actor.id } },
      select: { studentId: true },
    }),
  ]);

  if (!assignedProfile && !classEnrollment) {
    throw new Error("Forbidden: Not your student");
  }
}

export type ManualAddCoinsInput = {
  studentId: string;
  amount: number;
  reason: string;
  createdById: string;
};

export async function addManualCoins(
  input: ManualAddCoinsInput
): Promise<ApplyCoinTransactionResult> {
  return applyCoinTransaction({
    studentId: input.studentId,
    amount: input.amount,
    type: CoinTransactionType.MANUAL_ADD,
    source: CoinTransactionSource.ADMIN_ACTION,
    reason: input.reason.trim(),
    createdById: input.createdById,
  });
}
