import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import zonesRouter from "./zones";
import slotsRouter from "./slots";
import parkingRouter from "./parking";
import adminRouter from "./admin";
import historyRouter from "./history";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/zones", zonesRouter);
router.use("/slots", slotsRouter);
router.use("/parking", parkingRouter);
router.use("/admin", adminRouter);
router.use("/history", historyRouter);
router.use("/users", usersRouter);

export default router;
