import { BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const CoursesTab = () => {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-heading font-bold">Courses</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-8 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <BookOpen size={28} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-semibold text-foreground">
            More Learning Content Coming Soon!
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            We're preparing exclusive courses to help you grow even faster. Stay tuned for updates.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs text-primary font-medium">Coming soon</span>
        </div>
      </motion.div>
    </div>
  );
};
