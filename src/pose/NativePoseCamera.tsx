import { ComponentType } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { PoseFrame } from '../engine/types';
import { mapLandmarks, portraitAspect } from './mapLandmarks';

type Props = {
  style?: StyleProp<ViewStyle>;
  active: boolean;
  facing: 'front' | 'back';
  onFrame: (f: PoseFrame) => void;
  onError?: (code: string) => void;
};

type NativeView = ComponentType<Record<string, unknown>>;

/** Das native Modul existiert nur im Development-Build, nicht in Expo Go → sicher laden. */
function loadNative(): NativeView | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-mediapipe-pose');
    return (mod.PoseCameraView as NativeView) ?? null;
  } catch {
    return null;
  }
}
const Native = loadNative();
export const nativePoseAvailable = Native !== null;

let aspect = 9 / 16;

export function NativePoseCamera({ style, active, facing, onFrame, onError }: Props) {
  if (!Native) return null;
  return (
    <Native
      style={style}
      isActive={active}
      cameraFacing={facing}
      frameLimit={30}
      skeleton={{ color: '#ffd400', jointRadius: 4, lineWidth: 3 }}
      onCameraConfigured={(c: { captureWidth: number; captureHeight: number }) => { aspect = portraitAspect(c.captureWidth, c.captureHeight); }}
      onInferenceError={(e: { code: string }) => onError?.(e.code)}
      onLandmark={(frame: { landmarks: { x: number; y: number; visibility?: number }[] }) =>
        onFrame({ t: Date.now(), pose: mapLandmarks(frame.landmarks, aspect) })}
    />
  );
}
