import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../components/Buttons";
import orgBannerImage from "../assets/images/org-banner.png";
import { WalletConnectContext } from "../context";
import { ethers } from "ethers";
import MembershipNFTABI from "infra-dao/artifacts/contracts/MembershipNFT.sol/MembershipNFT.json";
import BoxABI from "infra-dao/artifacts/contracts/Box.sol/Box.json";
import TokenBasedGovernanceABI from "infra-dao/artifacts/contracts/governance/TokenBasedGovernance.sol/TokenBasedGovernance.json";
import WeightedGovernanceABI from "infra-dao/artifacts/contracts/governance/WeightedGovernance.sol/WeightedGovernance.json";
import QuadraticGovernanceABI from "infra-dao/artifacts/contracts/governance/QuadraticGovernance.sol/QuadraticGovernance.json";
import MultiSigGovernanceABI from "infra-dao/artifacts/contracts/governance/MultiSigGovernance.sol/MultiSigGovernance.json";
import {
  Box,
  MembershipNFT,
  MultiSigGovernance,
  QuadraticGovernance,
  TokenBasedGovernance,
  WeightedGovernance,
} from "../../../infra-dao/typechain-types";
import { DAOContracts, initWeb3 } from "./CreateOrgDao";
import web3 from "web3";
import { useForm } from "react-hook-form";
import {
  CurrentBlockData,
  getCurrentVotingPower,
  ProposalData,
  ProposalState,
  requestVotingPower,
  VPForm,
} from "./Organization";
import { SubDAOContracts } from "./CreateProjectDao";
import { QuestionMarkTooltip } from "../components/QuestionMarkTooltip";
import { INPUT_CLASSES } from "../actions";
import { Accordion, AccordionItem } from "../components/Accordion";
import {
  getGovernance,
  ProposalCardSubDAO,
} from "../components/ProposalCardSubDAO";

export interface ProjectDAOData {
  name: string;
  description: string;
  votingPeriod: number;
  quorumPercentage: number;
  proposalThreshold: number;
  membershipNFTURI: string;
  governanceType: string;
  proposals: ProposalData[];
  projectId: number;
  creator: string;
  mints: string;
  address: string;
}

export const getProposalsData = async (
  signer: ethers.providers.JsonRpcSigner,
  subDAOContracts: SubDAOContracts
) => {
  const governance = getGovernance(signer, subDAOContracts);

  const len = (await governance.getProposalsLength()).toNumber();
  const proposals: ProposalData[] = [];

  for (let i = 0; i < len; i++) {
    const proposalId = await governance.proposalIds(i);
    const proposal = await governance.proposals(proposalId);
    const proposalStateNumber = (await governance.state(proposalId)).valueOf();
    const proposalState = ProposalState[proposalStateNumber];
    const votes = await governance.proposalVotes(proposalId);
    const targetFunction = ethers.utils.parseBytes32String(proposal.targetHash);

    const proposalData: ProposalData = {
      id: proposalId.toString(),
      description: proposal.description.toString(),
      proposerAddress: proposal.proposer,
      voters: proposal.votes.toNumber(),
      deadline: (await governance.proposalDeadline(proposalId)).toNumber(),
      state: proposalState.toString(),
      votesFor: votes.forVotes.toNumber(),
      votesAgainst: votes.againstVotes.toNumber(),
      target: targetFunction,
      // currentBlockNumber: blockNumber,
    };
    proposals.push(proposalData);
  }
  return proposals;
};

export const getProjectDAOData = async (
  signer: ethers.providers.JsonRpcSigner,
  subDAOContracts: SubDAOContracts
) => {
  const membershipNFT = new ethers.Contract(
    subDAOContracts.membershipNFT,
    MembershipNFTABI.abi,
    signer
  ) as MembershipNFT;
  const box = new ethers.Contract(
    subDAOContracts.box,
    BoxABI.abi,
    signer
  ) as Box;
  let projectGovernance: any;
  if (subDAOContracts.projectGovernanceType === "weighted") {
    projectGovernance = new ethers.Contract(
      subDAOContracts.projectGovernance!,
      WeightedGovernanceABI.abi,
      signer
    ) as WeightedGovernance;
  } else if (subDAOContracts.projectGovernanceType === "tokenBased") {
    projectGovernance = new ethers.Contract(
      subDAOContracts.projectGovernance!,
      TokenBasedGovernanceABI.abi,
      signer
    ) as TokenBasedGovernance;
  } else if (subDAOContracts.projectGovernanceType === "quadratic") {
    projectGovernance = new ethers.Contract(
      subDAOContracts.projectGovernance!,
      QuadraticGovernanceABI.abi,
      signer
    ) as QuadraticGovernance;
  } else if (subDAOContracts.projectGovernanceType === "multiSig") {
    projectGovernance = new ethers.Contract(
      subDAOContracts.projectGovernance!,
      MultiSigGovernanceABI.abi,
      signer
    ) as MultiSigGovernance;
  }

  const projectDAO = await box.getSubDAO(subDAOContracts.projectId!);
  const nftMints = (await membershipNFT.totalSupply()).toString();
  const proposalsLength = (
    await projectGovernance.getProposalsLength()
  ).toNumber();
  let proposals = [];
  for (let i = 0; i < proposalsLength; i++) {
    proposals.push(await projectGovernance.proposalIds(i));
  }
  const projectDAOData: ProjectDAOData = {
    name: ethers.utils.parseBytes32String(projectDAO.name),
    description: web3.utils.hexToUtf8(projectDAO.description),
    votingPeriod: (await projectGovernance.votingPeriod()).toNumber(),
    quorumPercentage: (await projectGovernance.getQuorumNumerator()).toNumber(),
    proposalThreshold: (await projectGovernance.proposalThreshold()).toNumber(),
    membershipNFTURI: await membershipNFT.getURI(),
    mints: nftMints,
    proposals: proposals,
    governanceType: subDAOContracts.projectGovernanceType!,
    projectId: subDAOContracts.projectId!,
    creator: subDAOContracts.creator!,
    address: subDAOContracts.projectGovernance!,
  };
  console.log(projectDAOData);

  return projectDAOData;
};

export const ProjectDAO = () => {
  const params = useParams();
  const addresses = JSON.parse(decodeURIComponent(params!.deployed!));
  const [subDAOContracts, setSubDAOContracts] =
    useState<SubDAOContracts>(addresses);
  const [projectDAOData, setProjectDAOData] = useState<ProjectDAOData>(
    {} as ProjectDAOData
  );
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [currentBlockData, setCurrentBlockData] = useState<CurrentBlockData>({
    blockNumber: 0,
    votingPower: 0,
  });
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>();
  const { account } = useContext(WalletConnectContext);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<VPForm>();
  const [daoContracts, setDAOContracts] = useState<DAOContracts>(
    {} as DAOContracts
  );

  const fetchProjectDAOData = async () => {
    if (account) {
      const { network, signer, provider } = await initWeb3(account);
      console.log({ network });
      setSigner(signer);
      const blockNumber = await provider.getBlock("latest");
      setBlockNumber(blockNumber.number);
      setSubDAOContracts(addresses);
      setDAOContracts({
        daoFactory: subDAOContracts.daoFactory,
        governanceToken: subDAOContracts.governanceToken,
        membershipNFT: subDAOContracts.membershipNFT,
        timeLock: subDAOContracts.timeLock,
        organizationGovernance: subDAOContracts.organizationGovernance,
        box: subDAOContracts.box,
        id: subDAOContracts.id,
      });
      const projectDAODataReceipt = await getProjectDAOData(
        signer,
        subDAOContracts
      );

      setProjectDAOData(projectDAODataReceipt);
      const votingPower = await getCurrentVotingPower(
        signer,
        subDAOContracts as DAOContracts,
        account
      );
      console.log({ votingPower });
      setCurrentBlockData({ blockNumber: blockNumber.number, votingPower });
      const proposals = await getProposalsData(signer, subDAOContracts);
      setProposals(proposals);
      console.log("PROPOSALS>>>", proposals);
    }
    return projectDAOData;
  };

  useEffect(() => {
    if (account) {
      fetchProjectDAOData().then((r) =>
        console.log("FETCHED PROJECT DAO DATA>>>", r)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, blockNumber]);

  const formValues = watch();
  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(formValues); // watch input value by passing the name of it
    if (account && daoContracts) {
      const { network, signer, provider } = await initWeb3(account);
      setSigner(signer);
      const res = await requestVotingPower(
        signer,
        daoContracts,
        account,
        data.votingPowerRequest
      );
      const blockNumber = await provider.getBlock("latest");
      setBlockNumber(blockNumber.number);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-[84px] text-gray-900 dark:text-gray-50">
        <div className="relative flex h-[250px] sm:h-[350px] w-full items-center justify-center">
          <div className="absolute top-0 left-0 h-full w-full">
            <img
              src={orgBannerImage}
              alt="Organisation banner"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-transparent"></div>
          <span className="absolute left-0 right-0 w-full bottom-8 md:bottom-16">
            <span className="container flex flex-col gap-8 w-full">
              <span className="flex items-center gap-4 justify-between flex-wrap">
                <h1 className="text-display-sm sm:text-display-lg font-semibold text-gray-50">
                  Welcome to {projectDAOData.name}
                </h1>

                <span className="flex items-center gap-3">
                  <PrimaryButton
                    type="button"
                    variant="PRIMARY"
                    onClick={() => {
                      navigate(
                        `/organization/propose/${encodeURIComponent(
                          JSON.stringify(subDAOContracts)
                        )}`
                      );
                    }}
                  >
                    Propose
                  </PrimaryButton>
                  <PrimaryButton
                    type="button"
                    variant="PRIMARY"
                    onClick={() => {
                      navigate(
                        `/organization/${encodeURIComponent(
                          JSON.stringify(daoContracts)
                        )}`
                      );
                    }}
                  >
                    {/* TODO: The route should be /organisation/ORG-ID/create */}
                    Back to Organization DAO
                  </PrimaryButton>
                </span>
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="container flex flex-col items-center gap-8 md:gap-12 py-12 md:py-24">
        {projectDAOData && (
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-3 text-gray-900 dark:text-gray-50">
                <div className="text-display-sm sm:text-display-lg font-semibold">
                  {projectDAOData.name}
                </div>
                <div className="text-body-sm md:text-body-md [word-break:break-word]">
                  {projectDAOData.description}
                </div>
              </div>

              <div className="grid grid-cols-6 md:grid-cols-12 items-center gap-10 text-gray-900 dark:text-gray-50">
                <div className="col-span-6 md:col-span-8 w-full h-full flex">
                  <div className="rounded-2xl border flex flex-col gap-3 py-4 md:py-6">
                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">DAO id:</div>
                      <div>{subDAOContracts.id}</div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">Project DAO id:</div>
                      <div>{subDAOContracts.projectId}</div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">
                        Project DAO Governance:
                      </div>
                      <div>{subDAOContracts.projectGovernanceType}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">
                        Minted Membership NFTs:
                      </div>
                      <div>{projectDAOData.mints}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">Voting period:</div>
                      <div>{projectDAOData.votingPeriod}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">Proposing Threshold:</div>
                      <div>{projectDAOData.proposalThreshold}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">Quorum Percentage:</div>
                      <div>{projectDAOData.quorumPercentage}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b last:border-0 px-4 pb-3">
                      <div className="font-semibold">Membership NFT URI:</div>
                      <a
                        href={projectDAOData.membershipNFTURI}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 [word-break:break-word]"
                      >
                        {projectDAOData.membershipNFTURI}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="col-span-6 md:col-span-4 order-[-1] md:order-1 w-full">
                  <span className="max-w-sm md:max-w-full mx-auto">
                    <img
                      alt="NFT"
                      className="border-2 rounded-lg"
                      src={
                        "https://bafkreidlo2ifkhytxnxtfzx5wthm4xqe3tkled6mw43ppd7nv4p7yaquzu.ipfs.nftstorage.link/"
                      }
                    ></img>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="w-fit p-8 border rounded-3xl border-gray-900 dark:border-gray-50 flex items-center justify-center">
          <div className="text-gray-900 dark:text-gray-50 text-display-xs font-medium">
            BlockNumber: {blockNumber}
          </div>
          {/*// TODO: This should update on every block*/}
        </div>

        <div className="w-full flex flex-col items-start gap-6 md:gap-8 text-gray-900 dark:text-gray-50">
          <div className="text-display-xs md:text-display-sm font-medium">
            Your Voting Power: {currentBlockData.votingPower}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full flex items-end flex-wrap gap-6"
          >
            <div className="flex flex-col gap-2">
              <span className="max-w-md w-full flex items-center gap-3 text-gray-900 dark:text-gray-50 flex-wrap">
                <QuestionMarkTooltip text="Voting power is the amount of votes you can cast on a proposal. The more tokens you have, the more voting power you have on token based governances.">
                  Governance Token Request
                </QuestionMarkTooltip>
                <input
                  {...register("votingPowerRequest", { required: true })}
                  placeholder="e.g. 10 (10 VP)"
                  type="number"
                  className={INPUT_CLASSES}
                  defaultValue={1} // 2 minutes
                />
              </span>

              {errors.votingPowerRequest && (
                <div className="text-red-500 font-medium text-body-sm">
                  Entering the amount of voting power to request is required
                </div>
              )}
            </div>
            <PrimaryButton type="submit" variant="PRIMARY">
              Get More Voting Power
            </PrimaryButton>
          </form>
        </div>

        <div className="w-full">
          {!projectDAOData.proposals ||
          projectDAOData.proposals.length === 0 ? (
            <div className="flex flex-col items-center gap-6 md:gap-8">
              <div className="text-body-md md:text-body-xl font-medium text-gray-900 dark:text-gray-50">
                There are no existing proposals.
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-8">
              <Accordion>
                {proposals &&
                  proposals.map((proposal, i) => (
                    <AccordionItem title={proposal.description} key={i}>
                      <ProposalCardSubDAO
                        key={i}
                        proposal={proposal}
                        account={account!}
                        signer={signer!}
                        subDAOContracts={subDAOContracts}
                        onVoteActionChange={fetchProjectDAOData}
                      />
                    </AccordionItem>
                  ))}
              </Accordion>

              <PrimaryButton
                type="button"
                variant="PRIMARY"
                onClick={() => {
                  navigate(
                    `/organization/propose/${encodeURIComponent(
                      JSON.stringify(subDAOContracts)
                    )}`
                  );
                }}
                className="w-full max-w-xs"
              >
                Propose
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
