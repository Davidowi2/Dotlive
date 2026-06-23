/**
 * Explicit insert types for tables whose Drizzle-generated
 * Insert type doesn't include optional fields the routes want
 * to write.
 *
 * Use these as the type of the `.values({...} as any)` argument when
 * a route needs to set optional fields like `description`,
 * `deliveryDays`, etc.
 *
 * Example:
 *   import type { NewService } from "../db/insertTypes.js";
 *   await db.insert(services).values({ ... } satisfies NewService);
 */

import type {
  users,
  wallets,
  transactions,
  ventures,
  assessments,
  courses,
  courseEnrollments,
  events,
  eventRegistrations,
  pitchathons,
  pitchathonApplications,
  communities,
  communityMembers,
  services,
  jobListings,
  serviceOrders,
  serviceReviews,
  investorSaves,
  meetingRequests,
  roleRequirements,
  payments,
} from "./schema.js";

export type NewUser = typeof users.$inferInsert;
export type NewWallet = typeof wallets.$inferInsert;
export type NewTransaction = typeof transactions.$inferInsert;
export type NewVenture = typeof ventures.$inferInsert;
export type NewAssessment = typeof assessments.$inferInsert;
export type NewCourse = typeof courses.$inferInsert;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
export type NewEvent = typeof events.$inferInsert;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type NewPitchathon = typeof pitchathons.$inferInsert;
export type NewPitchathonApplication = typeof pitchathonApplications.$inferInsert;
export type NewCommunity = typeof communities.$inferInsert;
export type NewCommunityMember = typeof communityMembers.$inferInsert;
export type NewService = typeof services.$inferInsert;
export type NewJobListing = typeof jobListings.$inferInsert;
export type NewServiceOrder = typeof serviceOrders.$inferInsert;
export type NewServiceReview = typeof serviceReviews.$inferInsert;
export type NewInvestorSave = typeof investorSaves.$inferInsert;
export type NewMeetingRequest = typeof meetingRequests.$inferInsert;
export type NewRoleRequirement = typeof roleRequirements.$inferInsert;
export type NewPayment = typeof payments.$inferInsert;

/**
 * Patch types for `.update().set({...})`. Routes typically
 * build these dynamically, so we allow `undefined` to mean
 * "don't touch this column".
 */
export type UserPatch = Partial<NewUser>;
export type VenturePatch = Partial<NewVenture>;
export type ServicePatch = Partial<NewService>;
export type JobPatch = Partial<NewJobListing>;
export type EventPatch = Partial<NewEvent>;
export type CoursePatch = Partial<NewCourse>;
export type CommunityPatch = Partial<NewCommunity>;
export type PitchathonPatch = Partial<NewPitchathon>;
