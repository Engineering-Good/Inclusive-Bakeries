import * as React from 'react';

import { LefuScaleViewProps } from './LefuScale.types';

export default function LefuScaleView(props: LefuScaleViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
