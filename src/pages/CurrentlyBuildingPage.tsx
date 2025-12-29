import React from "react";
import { Navbar } from "@/components/Navbar";
import CurrentlyBuilding from "@/components/CurrentlyBuilding";

const CurrentlyBuildingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12">
        <CurrentlyBuilding
          title="Page Under Construction"
          message="We're actively building this page. Check back soon for new features."
          note="If you'd like to help, please email bdenis1420@gmail.com to join the team today!"
        />
      </main>
    </div>
  );
};

export default CurrentlyBuildingPage;
