import { motion, HTMLMotionProps } from 'framer-motion';
import { Accordion, AccordionProps } from '@mui/material';

type MotionAccordionProps = Omit<AccordionProps, keyof HTMLMotionProps<"div">> & HTMLMotionProps<"div">;

export const MotionAccordion = motion(Accordion) as React.ComponentType<MotionAccordionProps>; 