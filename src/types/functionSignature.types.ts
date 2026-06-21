export type FunctionScalarType = 'integer' | 'number' | 'string' | 'boolean'

export type FunctionTypeNode =
  | { type: FunctionScalarType }
  | { type: 'array'; items: FunctionTypeNode }
  | { type: 'nullable'; value: FunctionTypeNode }

export interface FunctionArgument {
  name: string
  type: FunctionTypeNode
}

export interface FunctionSignature {
  name: string
  args: FunctionArgument[]
  returnType: FunctionTypeNode
}

export type StarterCodeByLanguage = Record<string, string>
