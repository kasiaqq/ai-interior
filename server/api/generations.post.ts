import { generateRestyle, parseGenerationForm } from '../utils/generate'
import { defineGuardedHandler } from '../utils/request-guard'

export default defineGuardedHandler(({ fields, photo }) => generateRestyle(parseGenerationForm(fields, photo)))
