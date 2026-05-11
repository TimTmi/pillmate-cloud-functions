import {messaging} from "../config/firebase";
import {getProfileTokens} from "./tokens";

export type MessageData = Record<string, string | number | boolean>;

export async function sendToProfile(
  profileId: string,
  data: MessageData,
): Promise<void> {
  const tokens = await getProfileTokens(profileId);

  if (tokens.length === 0) return;

  const payload: Record<string, string> = {};

  for (const [k, v] of Object.entries(data)) {
    payload[k] = String(v);
  }

  const dataWithProfile = {...payload, profileId};

  console.log(
    `[FCM] Sending to ${tokens.length} token(s) for profile ${profileId}`,
  );
  tokens.forEach((t, i) =>
    console.log(`[FCM]   Token ${i}: ${t.substring(0, 15)}...`),
  );

  const results = await Promise.allSettled(
    tokens.map((token) =>
      messaging.send({
        token,
        data: dataWithProfile,
        android: {priority: "high"},
      }),
    ),
  );

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`${tokens[i].substring(0, 15)}: SUCCESS`);
    } else {
      console.log(
        `${tokens[i].substring(0, 15)}: FAILED - ${
          result.reason?.code || result.reason
        }`,
      );
    }
  });

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const errorCode = result.reason?.code;
      if (
        errorCode === "messaging/invalid-registration-token" ||
        errorCode === "messaging/registration-token-not-registered"
      ) {
        console.log(`Stale token: ${tokens[i].substring(0, 10)}...`);
      }
    }
  }
}
