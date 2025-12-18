/**
 * Digital SAT Exam Template
 * 
 * Structure:
 * - 2 main sections: Math and Verbal
 * - Each section has 2 modules
 * - Auto-timed modules with auto-submit
 */

export const SAT_STRUCTURE = {
  VERBAL: {
    sectionName: "Verbal",
    modules: [
      {
        name: "Verbal Module 1",
        minQuestions: 27,
        duration: 32,
        order: 0,
      },
      {
        name: "Verbal Module 2",
        minQuestions: 27,
        duration: 32,
        order: 1,
      },
    ],
  },
  MATH: {
    sectionName: "Math",
    modules: [
      {
        name: "Math Module 1",
        minQuestions: 22,
        duration: 35, // minutes
        order: 2,
      },
      {
        name: "Math Module 2",
        minQuestions: 22,
        duration: 35,
        order: 3,
      },
    ],
  },
};

export function getSATModuleInfo(moduleName: string) {
  for (const section of Object.values(SAT_STRUCTURE)) {
    const module = section.modules.find((m) => m.name === moduleName);
    if (module) {
      return {
        ...module,
        sectionName: section.sectionName,
      };
    }
  }
  return null;
}

export function validateSATModule(moduleName: string, questionCount: number): { valid: boolean; error?: string } {
  const moduleInfo = getSATModuleInfo(moduleName);
  
  if (!moduleInfo) {
    return { valid: false, error: "Invalid SAT module name" };
  }
  
  if (questionCount < moduleInfo.minQuestions) {
    return {
      valid: false,
      error: `${moduleName} requires minimum ${moduleInfo.minQuestions} questions. Current: ${questionCount}`,
    };
  }
  
  return { valid: true };
}

export function getSATSectionFromModule(moduleName: string): string | null {
  for (const section of Object.values(SAT_STRUCTURE)) {
    if (section.modules.some((m) => m.name === moduleName)) {
      return section.sectionName;
    }
  }
  return null;
}

export function getNextSATModule(currentModuleName: string): string | null {
  const allModules = [
    ...SAT_STRUCTURE.VERBAL.modules,
    ...SAT_STRUCTURE.MATH.modules,
  ].sort((a, b) => a.order - b.order);
  
  const currentIndex = allModules.findIndex((m) => m.name === currentModuleName);
  
  if (currentIndex === -1 || currentIndex === allModules.length - 1) {
    return null;
  }
  
  return allModules[currentIndex + 1].name;
}

export function canAccessSATModule(
  moduleName: string,
  completedModules: string[]
): boolean {
  const allModules = [
    ...SAT_STRUCTURE.VERBAL.modules,
    ...SAT_STRUCTURE.MATH.modules,
  ].sort((a, b) => a.order - b.order);
  
  const moduleIndex = allModules.findIndex((m) => m.name === moduleName);
  
  if (moduleIndex === -1) return false;
  if (moduleIndex === 0) return true; // First module is always accessible
  
  // Check if all previous modules are completed
  for (let i = 0; i < moduleIndex; i++) {
    if (!completedModules.includes(allModules[i].name)) {
      return false;
    }
  }
  
  return true;
}

export function getSATModuleOrder(sectionType: "READING" | "WRITING", moduleNumber: 1 | 2): number {
  if (sectionType === "READING") {
    // Verbal: order 0 və 1
    return moduleNumber - 1;
  } else {
    // Math: order 2 və 3
    return moduleNumber + 1;
  }
}

