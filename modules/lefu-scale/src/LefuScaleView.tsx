import { requireNativeView } from 'expo';
import * as React from 'react';

import { LefuScaleViewProps } from './LefuScale.types';

const NativeView: React.ComponentType<LefuScaleViewProps> =
  requireNativeView('LefuScale');

export default function LefuScaleView(props: LefuScaleViewProps) {
  return <NativeView {...props} />;
}
