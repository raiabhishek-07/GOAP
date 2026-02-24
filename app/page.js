import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Overview from "./components/Overview";
import CorePieces from "./components/CorePieces";
import PlannerViz from "./components/PlannerViz";
import Walkthrough from "./components/Walkthrough";
import Comparison from "./components/Comparison";
import MentalModel from "./components/MentalModel";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Overview />
        <CorePieces />
        <PlannerViz />
        <Walkthrough />
        <Comparison />
        <MentalModel />
      </main>
      <Footer />
    </>
  );
}
