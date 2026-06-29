import type { Metadata } from "next";
import { PredictPage } from "@/components/site/PredictPage";

export const metadata: Metadata = {
  title: "PREDICT — Predictive Response and Disease Evaluation in Ovarian Cancer with Generative AI",
  description:
    "PREDICT is an FRRB-funded consortium that uses generative AI to synthesise post-chemotherapy CT at diagnosis, forecast tumor progression and predict treatment response in ovarian cancer.",
};

export default function Predict() {
  return <PredictPage />;
}
