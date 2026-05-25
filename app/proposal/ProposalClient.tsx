"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { decodeProposalData } from "@/lib/proposalUtils";
import ProposalHeader from "@/components/proposal/ProposalHeader";
import PackageDisplay from "@/components/proposal/PackageDisplay";
import AdditionalServices from "@/components/proposal/AdditionalServices";
import SummarySection from "@/components/proposal/SummarySection";
import ProposalTermsSection from "@/components/proposal/ProposalTermsSection";
import ProposalFooter from "@/components/proposal/ProposalFooter";
import LoadingState from "@/components/proposal/LoadingState";
import ErrorState from "@/components/proposal/ErrorState";
import ProposalCTA from "@/components/proposal/ProposalCTA";
import PrintButton from "@/components/proposal/PrintButton";
import { CURRENCIES, CurrencyState } from "@/lib/useCurrencyRates";

const ProposalPage = () => {
  const searchParams = useSearchParams();
  const proposalParam = searchParams.get("proposal");
  const tokenParam = searchParams.get("token");
  const [linkCopied, setLinkCopied] = useState(false);

  // Helper function to normalize discount structure
  const normalizeDiscounts = (discounts) => {
    const normalized = {
      packageDiscount: { type: "percentage", value: 0 },
      serviceDiscounts: {},
      overallDiscount: { type: "percentage", value: 0 },
    };

    // Normalize package discount
    if (discounts?.packageDiscount) {
      normalized.packageDiscount =
        typeof discounts.packageDiscount === "number"
          ? { type: "percentage", value: discounts.packageDiscount }
          : discounts.packageDiscount;
    }

    // Normalize overall discount
    if (discounts?.overallDiscount) {
      normalized.overallDiscount =
        typeof discounts.overallDiscount === "number"
          ? { type: "percentage", value: discounts.overallDiscount }
          : discounts.overallDiscount;
    }

    // Normalize service discounts
    if (discounts?.serviceDiscounts) {
      Object.entries(discounts.serviceDiscounts).forEach(([id, discount]) => {
        normalized.serviceDiscounts[id] =
          typeof discount === "number"
            ? { type: "percentage", value: discount }
            : discount;
      });
    }

    return normalized;
  };

  // Generate a shareable link based on the current URL
  const getShareableLink = () => {
    if (typeof window === "undefined") return null;
    return window.location.href;
  };

  const shareableLink = getShareableLink();

  const copyLinkToClipboard = () => {
    if (!shareableLink) return;

    navigator.clipboard
      .writeText(shareableLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
      });
  };

  // Use React Query to fetch proposal data
  const { data, isLoading, error } = useQuery({
    queryKey: ["proposal", tokenParam, proposalParam],
    queryFn: async () => {
      try {
        // If we have a token, fetch from Supabase
        if (tokenParam) {
          // Find the proposal link
          const { data: link, error: linkError } = await supabase
            .from("proposal_links")
            .select("proposal_id, views_count")
            .eq("token", tokenParam)
            .single();

          if (linkError) {
            throw new Error("Invalid proposal link");
          }

          // Get the proposal
          const { data: proposal, error: proposalError } = await supabase
            .from("proposals")
            .select(
              `
              *,
              client:clients(*),
              package:packages(
                *,
                features:package_features(*)
              ),
              proposal_services(
                *,
                service:services(*)
              )
            `,
            )
            .eq("id", link.proposal_id)
            .single();

          if (proposalError) {
            throw new Error("Failed to load proposal");
          }

          // Update the view count
          await supabase
            .from("proposal_links")
            .update({ views_count: (link.views_count || 0) + 1 })
            .eq("token", tokenParam);

          // Handle order_id that might be stored as an object or other type
          let orderId = "";
          if (typeof proposal.order_id === "string") {
            orderId = proposal.order_id;
          } else if (
            proposal.order_id &&
            typeof proposal.order_id === "object"
          ) {
            // If it's an object, try to extract a string value
            orderId = proposal.order_id.toString();
          } else {
            orderId = String(proposal.order_id || "");
          }

          // Use saved JSON data to preserve historical proposal state
          const enhancedProposalData = {
            ...proposal.proposal_data,
            // Always use saved package data from proposal_data to preserve historical state
            selectedPackage: proposal.proposal_data?.selectedPackage,
            includePackage: proposal.include_package,
            // Always use saved services data from proposal_data to preserve historical state
            selectedServices: proposal.proposal_data?.selectedServices || [],
            // Include ToS data from database
            tos_template_id: proposal.tos_template_id,
            tos_snapshot: proposal.tos_snapshot,
            created_at: proposal.created_at,
          };

          return {
            proposalData: enhancedProposalData,
            orderId: orderId,
            status: proposal.status || "draft",
            discounts: normalizeDiscounts(
              proposal.proposal_data?.discounts || {
                packageDiscount: {
                  type: proposal.package_discount_type || "percentage",
                  value: proposal.package_discount_value || 0,
                },
                serviceDiscounts: {},
                overallDiscount: {
                  type: proposal.overall_discount_type || "percentage",
                  value: proposal.overall_discount_value || 0,
                },
              },
            ),
            proposalDate: proposal.proposal_date,
            tos_template_id: proposal.tos_template_id,
            tos_snapshot: proposal.tos_snapshot,
            created_at: proposal.created_at,
          };
        }
        // If we have encoded proposal data directly in the URL
        else if (proposalParam) {
          const decodedData = decodeProposalData(proposalParam);
          if (!decodedData) {
            throw new Error("Invalid proposal data");
          }

          // Initialize data with defaults to handle older proposal formats
          const normalizedData = {
            ...decodedData,
            includePackage: decodedData.includePackage !== false,
            selectedPackageIndex:
              decodedData.selectedPackageIndex === null
                ? 1
                : decodedData.selectedPackageIndex,
          };

          // Initialize service discounts
          const initialDiscounts = normalizeDiscounts(normalizedData.discounts);

          if (
            !normalizedData.discounts &&
            normalizedData.selectedServices &&
            normalizedData.selectedServices.length > 0
          ) {
            const serviceDiscounts = {};
            normalizedData.selectedServices.forEach((service) => {
              serviceDiscounts[service.id] = { type: "percentage", value: 0 };
            });
            initialDiscounts.serviceDiscounts = serviceDiscounts;
          }

          return {
            proposalData: normalizedData,
            orderId: null, // URL-based proposals won't have an order ID
            status: "draft", // Default status for URL-based proposals
            discounts: initialDiscounts,
          };
        } else {
          throw new Error("No proposal data found");
        }
      } catch (error) {
        console.error("Error loading proposal:", error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.proposalData) {
    return (
      <ErrorState error={error?.message || "Failed to load proposal data"} />
    );
  }

  const {
    proposalData,
    orderId,
    status,
    discounts,
    proposalDate: dbProposalDate,
  } = data;

  const storedCurrency = CURRENCIES.find(c => c.code === proposalData.currency) ?? CURRENCIES[0];
  const currencyState: CurrencyState = {
    selected: storedCurrency,
    convert: (aedAmount: number) =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(aedAmount * storedCurrency.rate),
  };

  // Check if this is a custom proposal and extract the correct data
  const isCustomProposal = proposalData.isCustomProposal || false;
  const clientName = isCustomProposal
    ? proposalData.clientInfo?.clientName
    : proposalData.clientName;
  const companyName = isCustomProposal
    ? proposalData.clientInfo?.companyName
    : proposalData.companyName;
  const proposalDate = isCustomProposal
    ? proposalData.clientInfo?.proposalDate
    : proposalData.proposalDate;
  const additionalInfo = isCustomProposal
    ? proposalData.clientInfo?.additionalInfo
    : proposalData.additionalInfo;

  const isAcceptedOrPaid = ["accepted", "paid"].includes(status?.toLowerCase());

  const isXmaMedia =
    !isCustomProposal && proposalData.selectedPackage?.brand === 'xma_media';

  return (
    <div className={`min-h-screen py-6 px-4 ${isXmaMedia ? 'theme-brand bg-(--brand-bg) text-(--brand-fg)' : 'bg-zinc-900 text-white'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <PrintButton
            proposalData={proposalData}
            orderId={orderId}
            status={status}
            isXmaMedia={isXmaMedia}
          />
        </div>

        <ProposalHeader
          clientName={clientName}
          companyName={companyName}
          proposalDate={proposalDate}
          orderId={orderId}
          isXmaMedia={isXmaMedia}
        />


        {additionalInfo && (
          <div className={`mb-8 rounded-lg p-6 shadow-lg ${isXmaMedia ? 'bg-(--card)' : 'bg-zinc-800'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isXmaMedia ? 'text-(--primary)' : 'text-red-500'}`}>
              Project Details
            </h2>
            <div className={`p-5 rounded-lg ${isXmaMedia ? 'bg-(--background)/50' : 'bg-zinc-900/50'}`}>
              <div className={`whitespace-pre-wrap ${isXmaMedia ? 'text-(--foreground)/80' : 'text-zinc-300'}`}>
                {additionalInfo}
              </div>
            </div>
          </div>
        )}

        {/* Custom Proposal Services */}
        {isCustomProposal &&
          proposalData.services &&
          proposalData.services.length > 0 && (
            <div className="mb-8 bg-zinc-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-red-500">Services</h2>

              {proposalData.services.map((service, index) => (
                <div
                  key={service.id}
                  className={`${index > 0 ? "mt-6 pt-6 border-t border-zinc-700" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white">
                      {service.name}
                      {service.isMainService && (
                        <span className="ml-2 text-sm bg-red-600 text-white px-2 py-1 rounded">
                          Main Service
                        </span>
                      )}
                    </h3>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {service.price.toLocaleString()} AED
                      </p>
                      <p className="text-sm text-gray-400">
                        {service.paymentType === "monthly"
                          ? "per month"
                          : "one-time payment"}
                      </p>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-gray-300 mb-4">{service.description}</p>
                  )}

                  {service.features && service.features.length > 0 && (
                    <div className="bg-zinc-900/50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">
                        Features:
                      </h4>
                      <ul className="space-y-1">
                        {service.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start text-sm text-gray-300"
                          >
                            <span className="text-red-500 mr-2">•</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        {/* Standard Proposal Packages/Services */}
        {!isCustomProposal && (
          <>
            <PackageDisplay
              selectedPackageIndex={proposalData.selectedPackageIndex}
              selectedPackage={proposalData.selectedPackage}
              discount={discounts.packageDiscount}
              onDiscountChange={() => {}}
              includePackage={proposalData.includePackage !== false}
              isXmaMedia={isXmaMedia}
              currencyState={currencyState}
            />

            {proposalData.selectedServices &&
              proposalData.selectedServices.length > 0 && (
                <AdditionalServices
                  selectedServices={proposalData.selectedServices}
                  discounts={discounts.serviceDiscounts}
                  onDiscountChange={() => {}}
                  isXmaMedia={isXmaMedia}
                />
              )}
          </>
        )}

        {/* Custom Proposal Summary */}
        {isCustomProposal ? (
          <div className="mb-8 bg-zinc-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-red-500">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white font-medium">
                  {proposalData.calculations.subtotal.toLocaleString()} AED
                </span>
              </div>

              {proposalData.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">
                    Discount (
                    {proposalData.discountType === "percentage"
                      ? `${proposalData.discount}%`
                      : `${proposalData.discount} AED`}
                    )
                  </span>
                  <span className="text-red-400 font-medium">
                    -{proposalData.calculations.discountAmount.toLocaleString()}{" "}
                    AED
                  </span>
                </div>
              )}

              {proposalData.taxIncluded && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">VAT (5%)</span>
                  <span className="text-white font-medium">
                    {proposalData.calculations.taxAmount.toLocaleString()} AED
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-700">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">
                    {proposalData.calculations.totalAmount.toLocaleString()} AED
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SummarySection
            proposalData={proposalData}
            discounts={discounts}
            orderId={orderId}
            status={status}
            isXmaMedia={isXmaMedia}
            currencyState={currencyState}
          />
        )}

        {/* Terms and Conditions */}
        <ProposalTermsSection
          proposalData={{
            ...proposalData,
            tos_template_id: data.tos_template_id,
            tos_snapshot: data.tos_snapshot,
            created_at: data.created_at,
            proposalDate: data.proposalDate,
          }}
          isXmaMedia={isXmaMedia}
        />

        {status !== "paid" && <ProposalCTA isXmaMedia={isXmaMedia} />}

        <ProposalFooter isXmaMedia={isXmaMedia} />
      </div>
    </div>
  );
};

export default ProposalPage;
