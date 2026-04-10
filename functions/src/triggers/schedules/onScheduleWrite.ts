import * as functions from "firebase-functions";
import { sendToProfile } from "../../helpers/messaging";
import { EVENTS } from "../../types/events";

export const onScheduleWrite = functions.firestore
  .document("profiles/{profileId}/schedules/{scheduleId}")
  .onWrite(async (change, context) => {
    const { profileId, scheduleId } = context.params;

    let type = EVENTS.SCHEDULE_UPDATED;

    if (!change.after.exists) {
      type = EVENTS.SCHEDULE_DELETED;
    } else if (!change.before.exists) {
      type = EVENTS.SCHEDULE_CREATED;
    }

    await sendToProfile(profileId, {
      type,
      scheduleId,
    });
  });
