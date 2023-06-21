import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PrimaryButton } from "../components/Buttons";
import orgBannerImage from "../assets/images/org-banner.png";
import { WalletConnectContext } from "../context";
import { ethers } from "ethers";
import DAOFactoryABI from "infra-dao/artifacts/contracts/DAOFactory.sol/DAOFactory.json";
import MembershipNFTABI from "infra-dao/artifacts/contracts/MembershipNFT.sol/MembershipNFT.json";
import GovernanceTokenABI from "infra-dao/artifacts/contracts/GovernanceToken.sol/GovernanceToken.json";
import BoxABI from "infra-dao/artifacts/contracts/Box.sol/Box.json";
import OrganizationGovernanceABI from "infra-dao/artifacts/contracts/governance/OrganizationGovernance.sol/OrganizationGovernance.json";
import {
  Box,
  DAOFactory,
  GovernanceToken,
  MembershipNFT,
  MultiSigGovernance,
  OrganizationGovernance,
  QuadraticGovernance,
  TokenBasedGovernance,
  WeightedGovernance,
} from "infra-dao/typechain-types";
import { DAOContracts, initWeb3 } from "./CreateOrgDao";
import { Tab, Tabs } from "../components/Tabs";
import web3 from "web3";
import { DAOCard, DAOContractsDataCard } from "../components/Cards";
import { QuestionMarkTooltip } from "../components/QuestionMarkTooltip";
import { INPUT_CLASSES } from "../actions";
import { useForm } from "react-hook-form";
import { ProjectDAOData } from "./ProjectDAO";
import TokenBasedGovernanceABI from "infra-dao/artifacts/contracts/governance/TokenBasedGovernance.sol/TokenBasedGovernance.json";
import WeightedGovernanceABI from "infra-dao/artifacts/contracts/governance/WeightedGovernance.sol/WeightedGovernance.json";
import QuadraticGovernanceABI from "infra-dao/artifacts/contracts/governance/QuadraticGovernance.sol/QuadraticGovernance.json";
import MultiSigGovernanceABI from "infra-dao/artifacts/contracts/governance/MultiSigGovernance.sol/MultiSigGovernance.json";
import { Accordion, AccordionItem } from "../components/Accordion";
import { ProposalCardOrg } from "../components/ProposalCardOrg";
import { ProjectCard } from "../components/ProjectCard";

interface ImageNFT {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: any[];
}

export interface CurrentBlockData {
  blockNumber: number;
  votingPower: number;
}

export interface ProposalData {
  id: string;
  description: string;
  proposerAddress: string;
  voters: number;
  state: string;
  deadline: number;
  votesFor: number;
  votesAgainst: number;
  target: string;
  governanceType?: string;
}

export interface DAOData {
  name: string;
  description: string;
  votingPeriod: number;
  quorumPercentage: number;
  proposalThreshold: number;
  membershipNFTURI: string;
  mints: string;
  proposals: string[];
  subDAOs: ProjectDAOData[];
}

export enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

export const getCurrentVotingPower = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts,
  account: string
) => {
  const governanceToken = new ethers.Contract(
    daoContracts.governanceToken,
    GovernanceTokenABI.abi,
    signer
  ) as GovernanceToken;

  const governanceTokenBalance = await governanceToken.balanceOf(account);

  return governanceTokenBalance.toNumber();
};

export const requestVotingPower = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts,
  account: string,
  amount: number
) => {
  const governanceToken = new ethers.Contract(
    daoContracts.governanceToken,
    GovernanceTokenABI.abi,
    signer
  ) as GovernanceToken;

  const tx = await governanceToken.mint(account, amount);
  await tx.wait();
  return tx.confirmations;
};

export const getSubDAOs = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts,
  daoData: DAOData
) => {
  const box = new ethers.Contract(daoContracts.box, BoxABI.abi, signer) as Box;

  const subDAOCount = (await box.getSubDAOCount()).toNumber();
  const subDAOs = await box.getSubDAOs();

  for (let i = 0; i < subDAOCount; i++) {
    const projectDAO = subDAOs[i];
    console.log(projectDAO);
    let projectGovernance: any;
    const projectGovernanceType = ethers.utils.parseBytes32String(
      projectDAO.subDAOType
    );
    if (projectGovernanceType === "weighted") {
      projectGovernance = new ethers.Contract(
        projectDAO.subDAOAddress,
        WeightedGovernanceABI.abi,
        signer
      ) as WeightedGovernance;
    } else if (projectGovernanceType === "tokenBased") {
      projectGovernance = new ethers.Contract(
        projectDAO.subDAOAddress,
        TokenBasedGovernanceABI.abi,
        signer
      ) as TokenBasedGovernance;
    } else if (projectGovernanceType === "quadratic") {
      projectGovernance = new ethers.Contract(
        projectDAO.subDAOAddress,
        QuadraticGovernanceABI.abi,
        signer
      ) as QuadraticGovernance;
    } else if (projectGovernanceType === "multiSig") {
      projectGovernance = new ethers.Contract(
        projectDAO.subDAOAddress,
        MultiSigGovernanceABI.abi,
        signer
      ) as MultiSigGovernance;
    }

    const projectDAOData: ProjectDAOData = {
      name: ethers.utils.parseBytes32String(projectDAO.name),
      description: web3.utils.hexToUtf8(projectDAO.description),
      votingPeriod: (await projectGovernance.votingPeriod()).toNumber(),
      quorumPercentage: (
        await projectGovernance.getQuorumNumerator()
      ).toNumber(),
      proposalThreshold: (
        await projectGovernance.proposalThreshold()
      ).toNumber(),
      membershipNFTURI: await daoData.membershipNFTURI,
      mints: daoData.mints,
      governanceType: projectGovernanceType!,
      proposals: [],
      projectId: i,
      creator: "",
      address: projectDAO.subDAOAddress,
    };
    daoData.subDAOs.push(projectDAOData);
  }
};

const getProposalsData = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts
) => {
  const organizationGovernance = new ethers.Contract(
    daoContracts.organizationGovernance,
    OrganizationGovernanceABI.abi,
    signer
  ) as OrganizationGovernance;

  const len = (await organizationGovernance.getProposalsLength()).toNumber();
  const proposals: ProposalData[] = [];

  for (let i = 0; i < len; i++) {
    const proposalId = await organizationGovernance.proposalIds(i);
    const proposal = await organizationGovernance.proposals(proposalId);
    const proposalStateNumber = (
      await organizationGovernance.state(proposalId)
    ).valueOf();
    const proposalState = ProposalState[proposalStateNumber];
    const votes = await organizationGovernance.proposalVotes(proposalId);
    const targetFunction = ethers.utils.parseBytes32String(proposal.targetHash);

    const proposalData: ProposalData = {
      id: proposalId.toString(),
      description: proposal.description.toString(),
      proposerAddress: proposal.proposer,
      voters: proposal.votes.toNumber(),
      deadline: (
        await organizationGovernance.proposalDeadline(proposalId)
      ).toNumber(),
      state: proposalState.toString(),
      votesFor: votes.forVotes.toNumber(),
      votesAgainst: votes.againstVotes.toNumber(),
      target: targetFunction,
    };
    proposals.push(proposalData);
  }
  return { proposals };
};

const getOrgDataAndGovToken = async (
  signer: ethers.providers.JsonRpcSigner,
  daoContracts: DAOContracts
) => {
  const governanceToken = new ethers.Contract(
    daoContracts.governanceToken,
    GovernanceTokenABI.abi,
    signer
  ) as GovernanceToken;
  const membershipNFT = new ethers.Contract(
    daoContracts.membershipNFT,
    MembershipNFTABI.abi,
    signer
  ) as MembershipNFT;
  const organizationGovernance = new ethers.Contract(
    daoContracts.organizationGovernance,
    OrganizationGovernanceABI.abi,
    signer
  ) as OrganizationGovernance;
  const box = new ethers.Contract(daoContracts.box, BoxABI.abi, signer) as Box;
  const daoFactory = new ethers.Contract(
    daoContracts.daoFactory,
    DAOFactoryABI.abi,
    signer
  ) as DAOFactory;

  const dao = await daoFactory.getDAO(daoContracts.id);
  let data: any = {};
  data.name = ethers.utils.parseBytes32String(dao.name);
  console.log("NAME>>>", dao.name);
  data.description = web3.utils.hexToUtf8(dao.description);
  data.votingPeriod = (await organizationGovernance.votingPeriod()).toNumber();
  data.quorumPercentage = (
    await organizationGovernance["quorumNumerator()"]()
  ).toNumber();
  data.proposalThreshold = (
    await organizationGovernance.proposalThreshold()
  ).toNumber();
  data.membershipNFTURI = await membershipNFT.getURI();
  data.mints = (await membershipNFT.totalSupply()).toString();
  data.subDAOs = [] as ProjectDAOData[];
  const proposalsLength = (
    await organizationGovernance.getProposalsLength()
  ).toNumber();
  let proposals = [];
  for (let i = 0; i < proposalsLength; i++) {
    proposals.push(await organizationGovernance.proposalIds(i));
  }
  data.proposals = proposals;
  await getSubDAOs(signer, daoContracts, data);
  console.log("DATA>>>", data);
  return { data, governanceToken };
};

export interface VPForm {
  votingPowerRequest: number;
}

export const Organization = () => {
  const params = useParams();
  const addresses = JSON.parse(decodeURIComponent(params!.deployed!));
  const [daoContracts, setDaoContracts] = useState<DAOContracts>(addresses);
  const [daoData, setDaoData] = useState<DAOData>({} as DAOData);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchDaoData = async () => {
    if (account) {
      const { network, signer, provider } = await initWeb3(account);
      console.log({ network });
      setSigner(signer);
      const blockNumber = await provider.getBlock("latest");
      setBlockNumber(blockNumber.number);
      const { data } = await getOrgDataAndGovToken(signer, daoContracts);
      setDaoContracts(addresses);
      console.log("DAO DATA>>>", data);
      setDaoData(data);
      const votingPower = await getCurrentVotingPower(
        signer,
        daoContracts,
        account
      );
      setCurrentBlockData({ blockNumber: blockNumber.number, votingPower });
      const { proposals } = await getProposalsData(signer, daoContracts);
      console.log("PROPOSALS>>>", proposals);
      setProposals(proposals);
    }
  };

  useEffect(() => {
    if (account) {
      fetchDaoData().then((r) => console.log("FETCHED DAO DATA>>>", r));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, blockNumber]);

  // let imageJson: any;
  // fetch(
  //   'https://bafkreidlo2ifkhytxnxtfzx5wthm4xqe3tkled6mw43ppd7nv4p7yaquzu.ipfs.nftstorage.link/'
  // ).then((r) => {
  //   console.log('R>>>', r);
  //   imageJson = r.json();
  //   console.log('IMAGE JSON>>>', imageJson);
  // });

  // const proposalThresholdNumber = daoData.proposalThreshold.toNumber();
  const formValues = watch();
  const onSubmit = async (data: any) => {
    console.log(data);
    console.log(formValues); // watch input value by passing the name of it
    if (account && daoContracts) {
      const { network, signer, provider } = await initWeb3(account);
      // const { signer, network, provider } = await initWeb3(account);
      // Execute deployDAO when the component mounts
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
                  Welcome to {daoData.name}
                </h1>

                <span className="flex items-center gap-3">
                  <PrimaryButton
                    type="button"
                    variant="PRIMARY"
                    onClick={() => {
                      navigate(
                        `/organization/propose/${encodeURIComponent(
                          JSON.stringify(daoContracts)
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
                        `/organization/createProject/${encodeURIComponent(
                          JSON.stringify(daoContracts)
                        )}`
                      );
                    }}
                  >
                    {/* TODO: The route should be /organisation/ORG-ID/create */}
                    Create new project DAO
                  </PrimaryButton>
                </span>
              </span>
            </span>
          </span>
        </div>
      </div>

      <div className="container flex flex-col items-center gap-8 md:gap-12 py-12 md:py-24">
        {daoData && (
          <div className="flex flex-col items-center gap-8 md:gap-12">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="flex flex-col gap-3 text-gray-900 dark:text-gray-50">
                <div className="text-display-sm sm:text-display-lg font-semibold">
                  {daoData.name}
                </div>
                <div className="text-body-sm md:text-body-md [word-break:break-word]">
                  {daoData.description}
                </div>
              </div>

              <div className="grid grid-cols-6 md:grid-cols-12 items-center gap-10 text-gray-900 dark:text-gray-50">
                <div className="col-span-6 md:col-span-8 w-full h-full flex">
                  <div className="rounded-2xl border border-gray-900 dark:border-gray-50 flex flex-col gap-3 py-4 md:py-6">
                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">DAO id:</div>
                      <div>{daoContracts.id}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">
                        Minted Membership NFTs:
                      </div>
                      <div>{daoData.mints}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">Voting period:</div>
                      <div>{daoData.votingPeriod}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">Proposing Threshold:</div>
                      <div>{daoData.proposalThreshold}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">Quorum Percentage:</div>
                      <div>{daoData.quorumPercentage}</div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 justify-between border-b border-gray-900 dark:border-gray-50 last:border-0 px-4 pb-3">
                      <div className="font-semibold">Membership NFT URI:</div>
                      <a
                        href={daoData.membershipNFTURI}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 [word-break:break-word]"
                      >
                        {daoData.membershipNFTURI}
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-span-6 md:col-span-4 order-[-1] md:order-1 w-full">
                  <span className="max-w-sm md:max-w-full mx-auto">
                    <img
                      alt="NFT"
                      className="border-2 rounded-2xl"
                      src={
                        "https://bafkreidlo2ifkhytxnxtfzx5wthm4xqe3tkled6mw43ppd7nv4p7yaquzu.ipfs.nftstorage.link/"
                      }
                    ></img>
                  </span>
                </div>
              </div>
            </div>

            <div className="w-fit p-8 border rounded-3xl border-gray-900 dark:border-gray-50 flex items-center justify-center">
              <div className="text-gray-900 dark:text-gray-50 text-display-xs font-medium">
                BlockNumber: {blockNumber}
              </div>
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
                      defaultValue={1}
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
              <Tabs>
                <Tab id="proposals" name="Proposals">
                  {!daoData.proposals || daoData.proposals.length === 0 ? (
                    <div className="flex flex-col items-center gap-6 md:gap-8">
                      <div className="text-body-md md:text-body-xl font-medium text-gray-900 dark:text-gray-50">
                        There are no existing proposals.
                      </div>

                      <PrimaryButton
                        type="button"
                        variant="PRIMARY"
                        onClick={() => {
                          navigate(
                            `/organization/propose/${encodeURIComponent(
                              JSON.stringify(daoContracts)
                            )}`
                          );
                        }}
                        className="w-full max-w-xs"
                      >
                        Propose
                      </PrimaryButton>
                      {/* I will add this here for testing purposes */}
                      {/*<ProposalCardOrg key={'proposal'} proposal= />*/}
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-8">
                      <Accordion>
                        {proposals &&
                          proposals.map((proposal, i) => (
                            <AccordionItem title={proposal.description} key={i}>
                              <ProposalCardOrg
                                key={i}
                                proposal={proposal}
                                account={account!}
                                signer={signer!}
                                daoContracts={daoContracts}
                                onVoteActionChange={fetchDaoData}
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
                              JSON.stringify(daoContracts)
                            )}`
                          );
                        }}
                        className="w-full max-w-xs"
                      >
                        Propose
                      </PrimaryButton>
                    </div>
                  )}
                </Tab>
                <Tab id="projects" name="Project">
                  {!daoData.subDAOs || daoData.subDAOs.length === 0 ? (
                    <div className="flex flex-col items-center gap-6 md:gap-8">
                      <div className="text-body-md md:text-body-xl font-medium text-gray-900 dark:text-gray-50">
                        There are no existing projects.
                      </div>

                      <PrimaryButton
                        type="button"
                        variant="PRIMARY"
                        className="w-full max-w-xs"
                        onClick={() => {
                          navigate(
                            `/organization/createProject/${encodeURIComponent(
                              JSON.stringify(daoContracts)
                            )}`
                          );
                        }}
                      >
                        Create new project
                      </PrimaryButton>
                      {/* I will add this here for testing purposes */}
                      {/*<ProposalCardOrg key={'proposal'} proposal= />*/}
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-8">
                      <Accordion>
                        {daoData.subDAOs &&
                          daoData.subDAOs.map((project, i) => (
                            <AccordionItem title={project.name} key={i}>
                              <ProjectCard
                                key={i}
                                projectData={project!}
                                daoContracts={daoContracts!}
                              />
                            </AccordionItem>
                          ))}
                      </Accordion>

                      <PrimaryButton
                        type="button"
                        variant="PRIMARY"
                        className="w-full max-w-xs"
                        onClick={() => {
                          navigate(
                            `/organization/createProject/${encodeURIComponent(
                              JSON.stringify(daoContracts)
                            )}`
                          );
                        }}
                      >
                        Create new project
                      </PrimaryButton>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 items-center gap-8 md:gap-12">
          <div className="flex h-full col-span-1">
            {daoData && (
              <DAOCard daoData={daoData} daoContracts={daoContracts} />
            )}
          </div>
          <div className="flex h-full col-span-1">
            {daoContracts && (
              <DAOContractsDataCard daoContracts={daoContracts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Organization;
