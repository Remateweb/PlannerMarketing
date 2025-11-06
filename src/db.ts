import Dexie, { Table } from "dexie";

export interface EventItem {
  id: string;
  name: string;
  date: string;
  time?: string;
  tags?: string[];
  isGap?: boolean; // 🔸 marca intervalos
  nextDate?: string; // 🔸 data do próximo evento (para contagem regressiva)
}

export type TaskItem = {
  id: string;
  eventId: string;
  title: string;
  kind: "pre" | "post" | "custom";
  offsetDays: number;
  offsetHours: number;
  deadlineISO: string;
  done: boolean;
};

export type TemplateTask = {
  title: string;
  kind: "pre" | "post";
  offsetDays: number;
  offsetHours?: number;
};

export type TemplateDef = {
  id: string;
  name: string;
  color?: string;
  tasks: TemplateTask[];
};

class PlannerDB extends Dexie {
  events!: Table<EventItem, string>;
  tasks!: Table<TaskItem, string>;
  tags!: Table<{ id: string; label: string }, string>;
  templates!: Table<TemplateDef, string>;

  constructor() {
    super("rw_planner_db");
    this.version(1).stores({
      events: "id,date",
      tasks: "id,eventId,deadlineISO,done",
      tags: "id,label",
      templates: "id,name",
    });
  }
}

export const db = new PlannerDB();
