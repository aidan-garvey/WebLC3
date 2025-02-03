
/**
 * simMessages.ts
 * 
 * This class contains the different types of message that can be passed between
 * a Simulator instance and the SimWorker class.
 */

export default class Messages {
    static RUN = "run";
    static STEP_IN = "step_in";
    static STEP_OUT = "step_out";
    static STEP_OVER = "step_over";
    static INIT = "init";
    static SET_BREAK = "set_break";
    static CLR_BREAK = "clr_break";
    static CLR_ALL_BREAKS = "clr_all_breaks";
    static CYCLE_UPDATE = "cycle_update";
    static WORKER_DONE = "worker_done";
    static CONSOLE = "console";
    static MSG_QUEUE_END = "msg_queue_end";
};
