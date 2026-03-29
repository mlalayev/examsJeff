import { useState } from "react";

/**
 * Modal state for delete question confirmation
 */
export interface DeleteQuestionModalState {
  isOpen: boolean;
  questionId: string | null;
  questionText?: string;
  questionNumber?: number;
}

/**
 * Modal state for delete section confirmation
 */
export interface DeleteSectionModalState {
  isOpen: boolean;
  sectionId: string | null;
  sectionTitle: string;
  questionsCount: number;
}

/**
 * Modal state for alerts
 */
export interface AlertModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

/**
 * Centralized modal state management for exam builder
 * Consolidates all modal states and their setters
 */
export function useBuilderModals() {
  const [deleteQuestionModal, setDeleteQuestionModal] = useState<DeleteQuestionModalState>({
    isOpen: false,
    questionId: null,
  });

  const [deleteSectionModal, setDeleteSectionModal] = useState<DeleteSectionModalState>({
    isOpen: false,
    sectionId: null,
    sectionTitle: "",
    questionsCount: 0,
  });

  const [alertModal, setAlertModal] = useState<AlertModalState>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const showDeleteQuestionModal = (
    questionId: string,
    questionText?: string,
    questionNumber?: number
  ) => {
    setDeleteQuestionModal({
      isOpen: true,
      questionId,
      questionText,
      questionNumber,
    });
  };

  const showDeleteSectionModal = (
    sectionId: string,
    sectionTitle: string,
    questionsCount: number
  ) => {
    setDeleteSectionModal({
      isOpen: true,
      sectionId,
      sectionTitle,
      questionsCount,
    });
  };

  const closeDeleteQuestionModal = () => {
    setDeleteQuestionModal({ isOpen: false, questionId: null });
  };

  const closeDeleteSectionModal = () => {
    setDeleteSectionModal({
      isOpen: false,
      sectionId: null,
      sectionTitle: "",
      questionsCount: 0,
    });
  };

  const closeAlertModal = () => {
    setAlertModal({ isOpen: false, title: "", message: "", type: "info" });
  };

  return {
    // States
    deleteQuestionModal,
    deleteSectionModal,
    alertModal,
    
    // Actions
    showAlert,
    showDeleteQuestionModal,
    showDeleteSectionModal,
    closeDeleteQuestionModal,
    closeDeleteSectionModal,
    closeAlertModal,
  };
}
