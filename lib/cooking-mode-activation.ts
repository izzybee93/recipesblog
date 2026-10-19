interface ScrollPosition { x: number; y: number }
interface PointerPosition { pointerId: number; pointerType: string; clientX: number; clientY: number }

export function createCookingModeActivationGuard() {
  let gesture: (PointerPosition & { scroll: ScrollPosition; cancelled: boolean }) | null = null

  return {
    start(event: PointerPosition, scroll: ScrollPosition) {
      const { pointerId, pointerType, clientX, clientY } = event
      gesture = event.pointerType === 'touch' || event.pointerType === 'pen'
        ? { pointerId, pointerType, clientX, clientY, scroll, cancelled: false }
        : null
    },
    move(event: Pick<PointerPosition, 'pointerId' | 'clientX' | 'clientY'>) {
      if (gesture?.pointerId !== event.pointerId) return
      if (Math.hypot(event.clientX - gesture.clientX, event.clientY - gesture.clientY) > 8) {
        gesture.cancelled = true
      }
    },
    cancel(event: Pick<PointerPosition, 'pointerId'>) {
      if (gesture?.pointerId === event.pointerId) gesture.cancelled = true
    },
    acceptClick(detail: number, scroll: ScrollPosition) {
      // Native keyboard and assistive activation has no pointing-device click count.
      const accepted = detail === 0 || !gesture || (!gesture.cancelled
        && Math.abs(scroll.x - gesture.scroll.x) <= 1
        && Math.abs(scroll.y - gesture.scroll.y) <= 1)
      gesture = null
      return accepted
    },
    reset() { gesture = null },
  }
}
