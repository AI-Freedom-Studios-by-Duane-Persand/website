// Worker/queue system (BullMQ or Agenda)
// This is a stub; actual implementation will depend on chosen queue system
export class Worker {
  async addJob(job: any) {
    // TODO: Add job to queue (BullMQ/Agenda)
    return { status: 'queued', job };
  }
}
