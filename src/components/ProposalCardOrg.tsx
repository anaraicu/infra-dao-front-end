import { DAOContracts, initWeb3 } from "../pages/CreateOrgDao";
import { ethers } from "ethers";
import { useState } from "react";
import OrganizationGovernanceABI from "infra-dao/artifacts/contracts/governance/OrganizationGovernance.sol/OrganizationGovernance.json";
import { OrganizationGovernance } from "infra-dao/typechain-types";
import { BaseButton, PrimaryButton } from "./Buttons";
import {
  CurrentBlockData,
  getCurrentVotingPower,
  ProposalData,
} from "../pages/Organization";

const voteForProposal = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts,
  proposalId: string,
  voteType: number
) => {
  const organizationGovernance = new ethers.Contract(
    daoContracts.organizationGovernance,
    OrganizationGovernanceABI.abi,
    signer
  ) as OrganizationGovernance;

  const tx = await organizationGovernance["castVote(uint256,uint8)"](
    proposalId,
    voteType
  );
  await tx.wait();

  console.log(tx);
  return tx.confirmations;
};
export const ProposalCardOrg = ({
  proposal,
  daoContracts,
  signer,
  account,
  onVoteActionChange,
}: {
  proposal: ProposalData;
  daoContracts: DAOContracts;
  signer: ethers.providers.JsonRpcSigner;
  account: string;
  onVoteActionChange: () => void;
}) => {
  const [blockNumber, setBlockNumber] = useState(0);
  const [currentBlockData, setCurrentBlockData] = useState<CurrentBlockData>({
    blockNumber: 0,
    votingPower: 0,
  });
  const [votesFor, setVoteFor] = useState(proposal.votesFor);
  const [votesAgainst, setVoteAgainst] = useState(proposal.votesAgainst);
  const [proposalState, setProposalState] = useState(proposal.state);
  const [proposalSucceeded, setProposalSucceeded] = useState(false);
  const castVote = async (proposalId: string, voteType: number) => {
    if (signer && daoContracts) {
      const { network, signer, provider } = await initWeb3(account);
      const res = await voteForProposal(
        signer,
        daoContracts,
        proposalId.toString(),
        voteType
      );
      const votingPower = await getCurrentVotingPower(
        signer,
        daoContracts,
        account
      );
      const blockNumber = await provider.getBlock("latest");
      setBlockNumber(blockNumber.number);
      setCurrentBlockData({ blockNumber: blockNumber.number, votingPower });
      console.log("VOTE RES>>>", res);
      onVoteActionChange();
    }
  };

  async function executeProposal(
    signer: ethers.providers.JsonRpcSigner,
    daoContracts: DAOContracts,
    proposalId: string
  ) {
    const governance = new ethers.Contract(
      daoContracts.organizationGovernance,
      OrganizationGovernanceABI.abi,
      signer
    ) as OrganizationGovernance;

    const proposal = await governance.proposals(proposalId);
    // In a database, store the proposal transaction data coming from the ProposalCreated Event
    // const { targets, values, calldatas, descriptionHash } = decodeProposalId(proposalId);
    // console.log("Queuing")
    // const queueTx = await governance.queue(
    //   targets,
    //   values,
    //   calldatas,
    //   descriptionHash
    // );
    // console.log("Queued")
    // // if (signer.provider === ) {
    // //   await moveTime(MIN_DELAY + 1);
    // //   await moveBlocks(1);
    // // }
    // await queueTx.wait(1);
    // console.log("Executing");
    // const executeTx = await governance.execute(
    //   targets,
    //   values,
    //   calldatas,
    //   descriptionHash
    // );
    // await executeTx.wait(1);
  }

  const handleExecute = async () => {
    if (account && daoContracts) {
      const { signer } = await initWeb3(account);
      await executeProposal(signer, daoContracts, proposal.id.toString());
    }
  };

  const [errorMessage, setErrorMessage] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 text-gray-900 dark:text-gray-50">
      <div className="flex flex-col gap-3 text-body-md">
        <div className="[word-break:break-word]">ID: {proposal.id}</div>
        <div className="[word-break:break-word]">Target: {proposal.target}</div>
        <div className="[word-break:break-word]">
          Proposer: {proposal.proposerAddress}
        </div>
        <div className="[word-break:break-word]">
          Deadline: {proposal.deadline}
        </div>
        {/*<div className="[word-break:break-word]"}>CurrentBlock: {proposal.currentBlockNumber}</div>*/}
        <div className="[word-break:break-word]">State: {proposal.state}</div>
      </div>

      <div className="mx-auto md:max-w-md w-full flex flex-col gap-3 items-center">
        <span className="w-full rounded-2xl flex items-center justify-evenly gap-6 border border-gray-900 dark:border-gray-50 p-6 text-gray-900 dark:text-gray-50 text-body-lg font-medium">
          <span>Votes: {proposal.voters}</span>
          <span>|</span>
          <span>For: {proposal.votesFor == null ? 0 : proposal.votesFor}</span>
          <span>|</span>
          <span>
            Against: {proposal.votesAgainst == null ? 0 : proposal.votesAgainst}
          </span>
        </span>

        {proposal.state === "Succeeded" ? (
          <PrimaryButton
            type="button"
            variant="PRIMARY"
            onClick={handleExecute}
          >
            Execute
          </PrimaryButton>
        ) : (
          <div className="w-full flex flex-col md:flex-row items-center gap-2">
            <BaseButton
              type="button"
              variant="GREEN"
              className="w-full flex justify-center"
              onClick={() => {
                castVote(proposal.id, 1)
                  .then((r) => console.log(r))
                  .catch((e) => {
                    console.log(e.message);
                    if (e.message.includes("voting power")) {
                      setErrorMessage(
                        "You did not have enough voting power at the moment of proposal creation."
                      );
                    } else if (e.message.includes("once")) {
                      setErrorMessage("You already voted on this proposal.");
                    } else if (e.message.includes("closed")) {
                      setErrorMessage("Voting is closed.");
                    }
                  });
              }}
            >
              FOR
            </BaseButton>
            <BaseButton
              type="button"
              variant="RED"
              className="w-full flex justify-center"
              onClick={() => {
                castVote(proposal.id, 0)
                  .then((r) => console.log(r))
                  .catch((e) => {
                    console.log(e.message);
                    if (e.message.includes("voting power")) {
                      setErrorMessage(
                        "You did not have enough voting power at the moment of proposal creation."
                      );
                    } else if (e.message.includes("once")) {
                      setErrorMessage("You already voted on this proposal.");
                    } else if (e.message.includes("closed")) {
                      setErrorMessage("Voting is closed.");
                    }
                  });
              }}
            >
              AGAINST
            </BaseButton>
          </div>
        )}

        {errorMessage && (
          <div className="text-red-500 font-medium text-body-sm">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
};
