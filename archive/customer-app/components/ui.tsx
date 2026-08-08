import { ReactNode } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "@/lib/theme";

export const Loading = ({ label }: { label?: string }) => (
  <View className="flex-1 items-center justify-center bg-white">
    <ActivityIndicator size="large" color={colors.brand} />
    {label ? <Text className="mt-3 text-muted">{label}</Text> : null}
  </View>
);

export const EmptyState = ({
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <View className="flex-1 items-center justify-center px-8">
    <Text className="text-6xl">{emoji}</Text>
    <Text className="mt-4 text-lg font-extrabold text-ink">{title}</Text>
    {subtitle ? (
      <Text className="mt-1 text-center text-sm text-muted">{subtitle}</Text>
    ) : null}
    {actionLabel && onAction ? (
      <Pressable
        onPress={onAction}
        className="mt-5 rounded-xl bg-brand-500 px-6 py-3"
      >
        <Text className="font-extrabold text-white">{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

export const Row = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <View className="flex-row items-center justify-between py-1">
    <Text className={`text-sm ${bold ? "font-extrabold text-ink" : "text-muted"}`}>
      {label}
    </Text>
    <Text className={`text-sm ${bold ? "font-extrabold text-ink" : "text-ink"}`}>
      {value}
    </Text>
  </View>
);

export const Card = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => (
  <View className="mb-3 rounded-2xl border border-line bg-white p-4">
    {title ? (
      <Text className="mb-3 font-extrabold text-ink">{title}</Text>
    ) : null}
    {children}
  </View>
);

export const Field = (props: any) => (
  <TextInput
    placeholderTextColor="#9CA3AF"
    {...props}
    className="mb-2 h-11 rounded-xl border border-line bg-surface px-3 text-[15px] text-ink"
  />
);
