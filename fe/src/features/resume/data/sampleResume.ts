import source from '../../../../Resume1.json'
import { validateResume } from '../schema/validateResume'

const result = validateResume(source)

if (!result.ok) {
  throw new Error(result.error)
}

export const sampleResumeSource = source
export const sampleResume = result.resume
