import { ProjectDAOData } from "../pages/ProjectDAO";
import { DAOContracts } from "../pages/CreateOrgDao";
import { useNavigate } from "react-router-dom";
import { BaseButton } from "./Buttons";
import { SubDAOContracts } from "../pages/CreateProjectDao";

export const ProjectCard = ({
  projectData,
  daoContracts,
}: {
  projectData: ProjectDAOData;
  daoContracts: DAOContracts;
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col gap-6 text-gray-900 dark:text-gray-50">
      <div className="flex flex-col gap-3 text-body-md">
        <div className="[word-break:break-word]">
          Project: {projectData.name}
        </div>
        <div className="[word-break:break-word]">
          Description: {projectData.description}
        </div>
        <div> Governance: {projectData.governanceType}</div>
        <div className="[word-break:break-word]">
          {" "}
          ID: {projectData.projectId}{" "}
        </div>
        <div className="[word-break:break-word]">
          {" "}
          Voting Period: {projectData.votingPeriod}
        </div>
        <div className="[word-break:break-word]">
          {" "}
          QuorumPercentage: {projectData.quorumPercentage}
        </div>
      </div>

      <BaseButton
        type="button"
        variant="PRIMARY"
        className="md:max-w-xs w-full flex justify-center"
        onClick={() => {
          let subDAOContracts: SubDAOContracts = {
            daoFactory: daoContracts.daoFactory,
            governanceToken: daoContracts.governanceToken,
            membershipNFT: daoContracts.membershipNFT,
            timeLock: daoContracts.timeLock,
            organizationGovernance: daoContracts.organizationGovernance,
            box: daoContracts.box,
            id: daoContracts.id,
            projectGovernance: projectData.address,
            projectGovernanceType: projectData.governanceType,
            creator: projectData.creator,
            projectId: projectData.projectId,
          };
          navigate(
            `/organization/project/${encodeURIComponent(
              JSON.stringify(subDAOContracts)
            )}`
          );
        }}
      >
        VIEW
      </BaseButton>
    </div>
  );
};
