import { getSummary }
from "./dashboard/summary.service.js";

export const dashboardSummaryService =
async (user, filters = {}) => {

  return await getSummary(
    user,
    filters
  );

};