import type { ComponentProps } from "react"
import {
  InputField as AstraInputField,
  TextareaField as AstraTextareaField,
} from "@figma/astraui"

// Astra's visual labels are not associated with the native controls.
// Preserve its public API and provide an accessible name without changing the kit.
export function InputField(props: ComponentProps<typeof AstraInputField>) {
  return (
    <AstraInputField
      {...props}
      aria-label={props["aria-label"] ?? props.label ?? props.placeholder}
    />
  )
}
export function TextareaField(
  props: ComponentProps<typeof AstraTextareaField>,
) {
  return (
    <AstraTextareaField
      {...props}
      aria-label={props["aria-label"] ?? props.label ?? props.placeholder}
    />
  )
}
export default InputField
