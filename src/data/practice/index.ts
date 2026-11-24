import { PracticeQuestion } from '../../types/excel';
import { MATH_PRACTICE } from './mathPractice';
import { LOGIC_PRACTICE } from './logicPractice';
import { LOOKUP_PRACTICE } from './lookupPractice';
import { TEXT_DATE_PRACTICE } from './textDatePractice';
import { FINANCE_ARRAY_PRACTICE } from './financeArrayPractice';

export const PRACTICE_QUESTIONS_BY_FORMULA: Record<string, PracticeQuestion[]> = {
  ...MATH_PRACTICE,
  ...LOGIC_PRACTICE,
  ...LOOKUP_PRACTICE,
  ...TEXT_DATE_PRACTICE,
  ...FINANCE_ARRAY_PRACTICE,
};
