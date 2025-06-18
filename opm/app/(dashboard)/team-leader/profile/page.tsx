import { getTeamLeaderProfileData } from "./actions"
import { TeamLeaderProfileClientPage } from "./team-leader-profile-client-page"

export default async function TeamLeaderProfilePage() {
  const { currentUser, teamMembers } = await getTeamLeaderProfileData()

  if (!currentUser) {
    // getTeamLeaderProfileData already handles redirect, but for type safety
    return null
  }

  return <TeamLeaderProfileClientPage currentUser={currentUser} teamMembers={teamMembers} />
}
