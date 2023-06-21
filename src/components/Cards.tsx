import { DAOData } from "../pages/Organization";
import { DAOContracts } from "../pages/CreateOrgDao";
import { useNavigate } from "react-router-dom";
import React from "react";

export const DAOCard = ({
  daoData,
  daoContracts,
  title = "DAO details",
}: {
  daoData: DAOData;
  daoContracts: DAOContracts;
  title?: string;
}) => {
  const navigate = useNavigate();

  return (
    <a
      href="javascript:void(0);"
      className="flex justify-center text-white p-8 md:p-10 rounded-3xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-indigo-500"
      onClick={() => {
        navigate(
          `/organization/${encodeURIComponent(JSON.stringify(daoContracts))}`
        );
      }}
    >
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col items-start gap-1">
          <div className="text-body-xl md:text-display-sm font-semibold [word-break:break-word]">
            {daoData.name}
          </div>
          <div className="[word-break:break-word] !text-white text-left">
            {daoData.description}
          </div>
        </div>

        <div className="rounded-2xl border border-white flex flex-col gap-3 py-3 md:py-4">
          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Members</div>
            <div>{daoData.mints}</div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Proposing Threshold</div>
            <div>{daoData.proposalThreshold}</div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Voting period</div>
            <div>{daoData.votingPeriod}</div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Quorum Percentage</div>
            <div>{daoData.quorumPercentage}</div>
          </div>
        </div>
      </div>
    </a>
  );
};

export const DAOContractsDataCard = ({
  daoContracts,
  title = "DAO Contract Details",
}: {
  daoContracts: DAOContracts;
  title?: string;
}) => {
  return (
    // TODO: RESTYLE THIS
    <div className="w-full flex justify-center text-white p-8 md:p-10 rounded-3xl bg-gradient-to-tr from-green-900 via-green-700 to-green-500">
      <div className="flex flex-col gap-8 w-full">
        <div className="flex flex-col items-start gap-1">
          <div className="text-body-xl md:text-display-sm font-semibold [word-break:break-word]">
            {title}
          </div>
        </div>

        <div className="rounded-2xl border border-white flex flex-col gap-3 py-3 md:py-4">
          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Governance:</div>
            <div className="[word-break:break-word]">
              {daoContracts.organizationGovernance}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Voting Power Token:</div>
            <div className="[word-break:break-word]">
              {daoContracts.governanceToken}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Membership Non-Fungible Token:</div>
            <div className="[word-break:break-word]">
              {daoContracts.membershipNFT}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">TimeLock:</div>
            <div className="[word-break:break-word]">
              {daoContracts.timeLock}
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3 last:pb-0">
            <div className="font-semibold">Box Contract:</div>
            <div className="[word-break:break-word]">{daoContracts.box}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
