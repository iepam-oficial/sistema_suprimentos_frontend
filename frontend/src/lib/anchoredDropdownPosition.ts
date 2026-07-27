export interface AnchoredRect {
  top: number;
  left: number;
  width: number;
}

export function computeAnchoredRect(
  rect: Pick<DOMRect, 'left' | 'width' | 'bottom'>,
  gap = 4,
): AnchoredRect {
  return {
    top: rect.bottom + gap,
    left: rect.left,
    width: rect.width,
  };
}
