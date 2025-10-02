import { Suspense } from "react";
import PaymentPageContent from "./PaymentPageContent";

export default function PaymentPage() {
    return (
        <Suspense fallback={null}>
            <PaymentPageContent />
        </Suspense>
    );
}
