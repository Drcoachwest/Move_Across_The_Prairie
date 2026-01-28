import fs from "fs";
import path from "path";

// Use a file-based store for persistence across reloads
const STORE_FILE = path.join(process.cwd(), ".lesson-plans-store.json");

function loadStore(): any[] {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading lesson plans store:", error);
  }
  return [];
}

function saveStore(data: any[]) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving lesson plans store:", error);
  }
}

export function getLessonPlans() {
  return loadStore();
}

export function addLessonPlan(plan: any) {
  const store = loadStore();
  store.push(plan);
  saveStore(store);
}

export function getLessonPlanById(id: string) {
  const store = loadStore();
  return store.find((plan) => plan.id === id);
}

export function deleteLessonPlan(id: string) {
  const store = loadStore();
  const filteredStore = store.filter((plan) => plan.id !== id);
  saveStore(filteredStore);
  return filteredStore.length < store.length; // Return true if deletion was successful
}

export function updateLessonPlan(id: string, updates: any) {
  const store = loadStore();
  const index = store.findIndex((plan) => plan.id === id);
  if (index === -1) {
    return false;
  }
  store[index] = { ...store[index], ...updates, updatedAt: new Date() };
  saveStore(store);
  return true;
}
