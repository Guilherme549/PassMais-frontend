import { Suspense } from "react";
import ConfirmationPageContent from "./ConfirmationPageContent";

export default function ConfirmationPage() {
    return (
        <Suspense fallback={null}>
            <ConfirmationPageContent />
        </Suspense>
    );
}
