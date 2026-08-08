import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForNotifications = async (): Promise<boolean> => {
  const { status } = await Notifications.getPermissionsAsync();
  const final =
    status === "granted"
      ? status
      : (await Notifications.requestPermissionsAsync()).status;
  return final === "granted";
};

export const notify = (title: string, body: string) =>
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
