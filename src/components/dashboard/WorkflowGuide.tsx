'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, User, Calendar, CreditCard, Clock, FileText } from 'lucide-react';

interface WorkflowGuideProps {
  className?: string;
}

export default function WorkflowGuide({ className = '' }: WorkflowGuideProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const workflows = [
    {
      title: "Appointment → Payment",
      icon: <Calendar className="w-5 h-5" />,
      steps: [
        "View appointment in table",
        "See suggested payment action (Consultation, Deposit, Final)",
        "Click payment button for instant link creation",
        "Customer payment history shows inline"
      ],
      color: "text-blue-400"
    },
    {
      title: "Request → Payment",
      icon: <FileText className="w-5 h-5" />,
      steps: [
        "View tattoo request",
        "Smart payment actions based on status",
        "One-click deposit or consultation payments",
        "Automatic status updates when paid"
      ],
      color: "text-purple-400"
    },
    {
      title: "Customer Context",
      icon: <User className="w-5 h-5" />,
      steps: [
        "See payment history inline in tables",
        "Total spent and payment success rate",
        "Last payment date and amount",
        "Click for full payment history"
      ],
      color: "text-green-400"
    },
    {
      title: "Smart Payments",
      icon: <Zap className="w-5 h-5" />,
      steps: [
        "Automatic amount calculation (30% deposits)",
        "Context-aware payment types",
        "Minimum amount enforcement",
        "Direct Square integration"
      ],
      color: "text-yellow-400"
    }
  ];

  return (
    <div className={`bg-[#111111] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#C9A449]/20 rounded-lg">
            <Zap className="w-5 h-5 text-[#C9A449]" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">New Workflow Features</h3>
            <p className="text-sm text-gray-400">Payment integration for maximum efficiency</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-[#1a1a1a]">
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {workflows.map((workflow, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-current/20 rounded-lg ${workflow.color}`}>
                      {workflow.icon}
                    </div>
                    <h4 className={`font-semibold ${workflow.color}`}>
                      {workflow.title}
                    </h4>
                  </div>
                  <ul className="space-y-2 ml-11">
                    {workflow.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-[#C9A449] mt-1">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-[#C9A449]/10 border border-[#C9A449]/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-[#C9A449] mt-0.5" />
                <div>
                  <h5 className="font-semibold text-[#C9A449] mb-2">Quick Tips</h5>
                  <ul className="space-y-1 text-sm text-gray-300">
                    <li>• <strong>Compact buttons</strong> in tables show most relevant payment action</li>
                    <li>• <strong>Dropdown menus</strong> show all available payment options</li>
                    <li>• <strong>Payment history</strong> appears inline to show customer context</li>
                    <li>• <strong>Smart amounts</strong> are automatically calculated based on appointment prices</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 