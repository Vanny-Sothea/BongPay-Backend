import { User } from "./types"; // optional, only if you need

declare global {
  namespace Express {
    interface Request {
      userId?: number; // or string if your IDs are strings
    }
  }
}
