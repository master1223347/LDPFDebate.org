import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type Props = {
  title?: string;
  message?: string;
  note?: string;
};

const CurrentlyBuilding: React.FC<Props> = ({
  title = "Currently Building",
  message = "This area of the site is under active development.",
  note,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const blocks = [0, 1, 2, 3];

  const containerVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { staggerChildren: 0.12, when: "beforeChildren" } },
  };

  const gearVariants = {
    hidden: { rotate: 0, opacity: 0 },
    visible: { rotate: 360, opacity: 1, transition: { repeat: Infinity, duration: 6, ease: "linear" } },
  } as const;

  const blockVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: (i: number) => ({ y: [12, -8, 12], opacity: 1, transition: { duration: 2.4, repeat: Infinity, repeatType: "loop", delay: i * 0.14 } }),
  } as any;

  const blobVariants = {
    hidden: { scale: 1, opacity: 0.35 },
    visible: { scale: 1.06, opacity: 0.6, transition: { duration: 5, repeat: Infinity, repeatType: "reverse" } },
  } as const;

  const progressVariants = {
    hidden: { width: "6%" },
    visible: { width: ["6%", "40%", "72%"], transition: { duration: 4, repeat: Infinity, repeatType: "reverse" } },
  } as any;

  return (
    <motion.section className="max-w-4xl mx-auto px-6 py-20 text-center relative" initial="hidden" animate={visible ? "visible" : "hidden"}>
      {/* decorative blurred blobs animated by framer-motion */}
      <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center" variants={containerVariants}>
        <motion.div className="w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full filter blur-3xl opacity-40" variants={blobVariants} />
      </motion.div>

      <motion.div
        className="relative z-10 overflow-hidden bg-card p-10 rounded-2xl shadow-xl"
        variants={containerVariants}
      >
        <motion.div className="flex flex-col items-center gap-6">
          <motion.div className="flex items-center gap-4" variants={containerVariants}>
            <motion.div className="p-3 bg-primary/10 rounded-full flex items-center justify-center w-16 h-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-8 w-8 text-primary"
                variants={gearVariants}
                initial="hidden"
                animate="visible"
              >
                <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82L4.31 3.4A2 2 0 017.14.57l.06.06A1.65 1.65 0 009 1.46c.57-.3 1.24-.3 1.81 0 .54-.36 1.29-.36 1.82 0 .57-.3 1.24-.3 1.81 0 .54-.36 1.29-.36 1.82 0a1.65 1.65 0 001.81-.93l.06-.06A2 2 0 0120.6 4.31l-.06.06a1.65 1.65 0 00-.33 1.82c.3.57.3 1.24 0 1.81.36.54.36 1.29 0 1.82.3.57.3 1.24 0 1.81z" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </motion.div>

            <motion.div className="text-left" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.12 } }}>
              <motion.h2 className="text-3xl font-extrabold tracking-tight" initial={{ scale: 0.98 }} animate={{ scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } }}>
                {title}
              </motion.h2>
              <motion.p className="mt-1 text-sm text-foreground/80 max-w-xl" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.18 } }}>
                {message}
              </motion.p>
            </motion.div>
          </motion.div>

          {note && (
            <motion.p className="text-xs text-foreground/60" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.26 } }}>
              {note}
            </motion.p>
          )}

          <div className="relative w-full h-28 flex items-end justify-center">
            {blocks.map((b, i) => (
              <motion.div
                key={b}
                className="mx-2 bg-gradient-to-br from-primary/80 to-secondary/70 rounded-md shadow-md"
                style={{ width: `${40 + i * 14}px`, height: `${40 + (i % 3) * 18}px` }}
                custom={i}
                variants={blockVariants}
                initial="hidden"
                animate="visible"
                aria-hidden
              />
            ))}
          </div>

          <div className="w-full max-w-xl px-6">
            <div className="h-2 bg-foreground/8 rounded-full overflow-hidden relative">
              <motion.div className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full absolute left-0 top-0" variants={progressVariants} initial="hidden" animate="visible" />
            </div>
            <motion.div className="mt-3 text-xs text-foreground/60" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.28 } }}>
              We're making steady progress — check back soon.
            </motion.div>
          </div>

          <motion.div className="mt-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.36 } }}>
            <motion.div whileHover={{ y: -6, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link to="/home" className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-medium shadow transition-transform">
                Return to home
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};

export default CurrentlyBuilding;
