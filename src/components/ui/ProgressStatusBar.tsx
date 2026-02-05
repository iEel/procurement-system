"use client";

import { Check, Clock, User, X, RotateCcw } from "lucide-react";

interface StepConfig {
    step: number;
    name: string;
    description?: string;
}

interface ApprovalData {
    step: number;
    stepName: string;
    approverName?: string | null;
    action?: string;
    actionDate?: string | null;
    comments?: string | null;
}

interface ProgressStatusBarProps {
    steps: StepConfig[];
    currentStep: number;
    status: string;
    approvals?: ApprovalData[];
}

export default function ProgressStatusBar({
    steps,
    currentStep,
    status,
    approvals = [],
}: ProgressStatusBarProps) {

    // Get approval data for a step
    const getApprovalForStep = (stepNumber: number) => {
        return approvals.find((a) => a.step === stepNumber);
    };

    const getStepStatus = (stepNumber: number) => {
        const approval = getApprovalForStep(stepNumber);

        if (status === "Rejected" && stepNumber === currentStep) return "rejected";
        if (approval?.action === "Approved") return "completed";
        if (approval?.action === "Rejected") return "rejected";
        if (approval?.action === "Returned") return "returned";
        if (stepNumber === currentStep && status === "Pending") return "current";
        if (stepNumber < currentStep) return "completed";
        return "pending";
    };

    const getCircleStyles = (stepStatus: string) => {
        switch (stepStatus) {
            case "completed":
                return "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30";
            case "rejected":
                return "bg-gradient-to-br from-red-400 to-rose-500 text-white shadow-lg shadow-red-500/30";
            case "returned":
                return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30";
            case "current":
                return "bg-gradient-to-br from-indigo-400 to-purple-500 text-white shadow-lg shadow-indigo-500/30 animate-pulse";
            default:
                return "bg-gray-100 text-gray-400 border-2 border-gray-200";
        }
    };

    const getLineColor = (stepIndex: number) => {
        const stepStatus = getStepStatus(steps[stepIndex].step);
        if (stepStatus === "completed") return "from-emerald-400 to-teal-500";
        if (stepStatus === "rejected") return "from-red-400 to-rose-500";
        if (stepStatus === "returned") return "from-amber-400 to-orange-500";
        return "from-gray-200 to-gray-200";
    };

    return (
        <div className="w-full p-8 card">
            <h3 className="text-lg font-bold text-gray-800 mb-8 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                </div>
                สถานะการอนุมัติ
            </h3>

            {/* Progress Bar */}
            <div className="relative">
                {/* Lines connecting steps */}
                <div className="absolute top-7 left-0 right-0 h-1 flex px-16">
                    {steps.slice(0, -1).map((_, index) => (
                        <div
                            key={index}
                            className={`flex-1 bg-gradient-to-r ${getLineColor(index)} transition-all duration-500`}
                        />
                    ))}
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                    {steps.map((step) => {
                        const stepStatus = getStepStatus(step.step);
                        const approval = getApprovalForStep(step.step);

                        return (
                            <div
                                key={step.step}
                                className="flex flex-col items-center text-center group"
                                style={{ width: `${100 / steps.length}%` }}
                            >
                                {/* Circle */}
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getCircleStyles(
                                        stepStatus
                                    )} transition-all duration-500 z-10 group-hover:scale-110`}
                                >
                                    {stepStatus === "completed" ? (
                                        <Check className="w-6 h-6" strokeWidth={3} />
                                    ) : stepStatus === "rejected" ? (
                                        <X className="w-6 h-6" strokeWidth={3} />
                                    ) : stepStatus === "returned" ? (
                                        <RotateCcw className="w-6 h-6" strokeWidth={2.5} />
                                    ) : stepStatus === "current" ? (
                                        <Clock className="w-6 h-6" />
                                    ) : (
                                        <span className="text-lg font-bold">{step.step}</span>
                                    )}
                                </div>

                                {/* Step Details */}
                                <div className="mt-4 space-y-1">
                                    <p
                                        className={`text-sm font-semibold ${stepStatus === "current"
                                            ? "text-indigo-600"
                                            : stepStatus === "completed"
                                                ? "text-emerald-600"
                                                : stepStatus === "rejected"
                                                    ? "text-red-600"
                                                    : stepStatus === "returned"
                                                        ? "text-amber-600"
                                                        : "text-gray-400"
                                            }`}
                                    >
                                        {step.name}
                                    </p>

                                    {step.description && (
                                        <p className="text-xs text-gray-400">{step.description}</p>
                                    )}

                                    {/* Approver Name */}
                                    {approval?.approverName && (
                                        <div className="flex items-center justify-center gap-1">
                                            <User className="w-3 h-3 text-gray-400" />
                                            <p className="text-xs text-gray-500 font-medium">{approval.approverName}</p>
                                        </div>
                                    )}

                                    {/* Action Date */}
                                    {approval?.actionDate && (
                                        <p className="text-xs text-gray-400">
                                            {new Date(approval.actionDate).toLocaleDateString("th-TH", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    )}

                                    {/* Status Badge */}
                                    {stepStatus !== "pending" && (
                                        <span
                                            className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${stepStatus === "completed"
                                                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white"
                                                : stepStatus === "rejected"
                                                    ? "bg-gradient-to-r from-red-400 to-rose-500 text-white"
                                                    : stepStatus === "returned"
                                                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                                                        : stepStatus === "current"
                                                            ? "bg-gradient-to-r from-indigo-400 to-purple-500 text-white"
                                                            : ""
                                                }`}
                                        >
                                            {stepStatus === "completed"
                                                ? "อนุมัติแล้ว"
                                                : stepStatus === "rejected"
                                                    ? "ไม่อนุมัติ"
                                                    : stepStatus === "returned"
                                                        ? "ส่งกลับแก้ไข"
                                                        : stepStatus === "current"
                                                            ? "รอดำเนินการ"
                                                            : ""}
                                        </span>
                                    )}

                                    {/* Comments - show for rejected or returned */}
                                    {approval?.comments && (stepStatus === "rejected" || stepStatus === "returned") && (
                                        <div className={`mt-3 p-2 rounded-lg text-xs max-w-[180px] ${stepStatus === "returned"
                                            ? "bg-amber-50 border border-amber-200 text-amber-700"
                                            : "bg-red-50 border border-red-200 text-red-700"
                                            }`}>
                                            <p className="font-medium mb-1">
                                                {stepStatus === "returned" ? "หมายเหตุ:" : "เหตุผล:"}
                                            </p>
                                            <p className="whitespace-pre-wrap">{approval.comments}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
