import React, { useEffect, useState } from "react";
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
    // trigger entrance animation
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <section className="max-w-3xl mx-auto px-6 py-12 text-center">
      <div
        className={`inline-flex flex-col items-center gap-6 bg-card p-8 rounded-lg transition-all duration-500 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="h-12 w-12 text-primary animate-bounce"
        >
          <path d="M3 21h18" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 21V9a2 2 0 012-2h10a2 2 0 012 2v12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 3v4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 3v4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-foreground/80">{message}</p>
          {note && <p className="mt-3 text-xs text-foreground/60">{note}</p>}
        </div>

        <div>
          <Link
            to="/home"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:brightness-95 transition"
          >
            Return to home
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CurrentlyBuilding;
