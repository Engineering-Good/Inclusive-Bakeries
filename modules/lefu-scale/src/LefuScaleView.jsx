import { requireNativeView } from 'expo';
import React from 'react';

const NativeView = requireNativeView('LefuScale');

export default function LefuScaleView(props) {
  return <NativeView {...props} />;
}
