import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="w-16 h-16 mb-6 text-muted-foreground"
      >
        <FileQuestion className="w-16 h-16" />
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold text-center">Page Not Found</h1>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="mt-4 text-lg text-center text-muted-foreground">
          We couldn't find the page you're looking for.
        </p>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Button asChild>
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </motion.div>
    </div>
  );
}