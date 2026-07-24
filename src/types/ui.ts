export interface AppSelectOption<TValue extends string = string> {
  label: string
  value: TValue
  description?: string
}
