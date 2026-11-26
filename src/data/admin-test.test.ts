import { describe, expect, it } from "vitest";
import {
  adminTestBadgeCounts,
  adminTestDashboard,
  assignAdminTestSupervisor,
  createAdminTestState,
} from "./admin-test";

describe("admin test fixtures", () => {
  it("includes assigned teams on projects already in progress or complete", () => {
    const state = createAdminTestState();
    const staffedProjects = state.projects.filter(
      (project) =>
        project.status === "berjalan" || project.status === "selesai",
    );

    expect(staffedProjects.length).toBeGreaterThan(0);
    expect(
      staffedProjects.every(
        (project) =>
          project.pengawas_id &&
          project.pengawas_name &&
          project.mandors.length > 0,
      ),
    ).toBe(true);
    expect(adminTestBadgeCounts(state).documentVerifications).toBe(4);
  });

  it("assigns an available supervisor locally and updates dashboard data", () => {
    const initial = createAdminTestState();
    const unassignedProjects = initial.projects.filter(
      (project) =>
        project.status === "alokasi_mandor_pengawas" &&
        project.pengawas_id === null,
    );
    const availableSupervisors = initial.supervisors.filter(
      (supervisor) => supervisor.available,
    );

    expect(unassignedProjects).toHaveLength(2);
    expect(availableSupervisors.length).toBeGreaterThanOrEqual(2);

    const first = assignAdminTestSupervisor(
      initial,
      unassignedProjects[0].id,
      availableSupervisors[0].id,
    );
    const firstDashboardProject = adminTestDashboard(first).projects.find(
      (project) => project.rawId === unassignedProjects[0].id,
    );
    expect(firstDashboardProject?.supervisor).toBe(
      availableSupervisors[0].full_name,
    );
    expect(
      first.supervisors.find(
        (supervisor) => supervisor.id === availableSupervisors[0].id,
      )?.available,
    ).toBe(false);

    const second = assignAdminTestSupervisor(
      first,
      unassignedProjects[1].id,
      availableSupervisors[1].id,
    );
    const secondDashboardProject = adminTestDashboard(second).projects.find(
      (project) => project.rawId === unassignedProjects[1].id,
    );
    expect(secondDashboardProject?.supervisor).toBe(
      availableSupervisors[1].full_name,
    );
    expect(adminTestDashboard(second).availableSupervisorsCount).toBe(0);
  });
});
