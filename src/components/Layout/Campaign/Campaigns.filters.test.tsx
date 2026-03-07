/**
 * Campaigns.filters.test.tsx
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import * as redux from "react-redux";
import Campaigns from "../../../pages/Campaigns";

/* ---------------- MOCK CHILD COMPONENTS ---------------- */

vi.mock("@/components/Layout/Campaign/CampaignHeader", () => ({
  default: () => <div>CampaignHeader</div>,
}));

vi.mock("@/components/Layout/Campaign/CampaignCard", () => ({
  default: ({ campaign }: any) => (
    <div data-testid="campaign-card">{campaign.name}</div>
  ),
}));

vi.mock("@/components/Layout/Campaign/AddNewCampaign", () => ({
  default: () => null,
}));

vi.mock("@/components/Layout/Campaign/SocialCampaignModal", () => ({
  default: () => null,
}));

vi.mock("@/components/Layout/Campaign/EmailCampaignModal", () => ({
  default: () => null,
}));

vi.mock("@/components/Layout/Campaign/CampaignDashboard", () => ({
  default: () => null,
}));

vi.mock("@/components/Layout/Campaign/EditCampaignModal", () => ({
  default: () => null,
}));

/* ---------------- MOCK SELECTOR ---------------- */

const mockCampaigns = [
  {
    id: "1",
    campaign_name: "Summer Sale",
    campaign_mode: 1,
    status: "live",
    is_active: true,
    start_date: "",
    end_date: "",
    social_media: [{ platform_name: "Instagram" }],
  },
  {
    id: "2",
    campaign_name: "Email Blast",
    campaign_mode: 2,
    status: "draft",
    is_active: false,
    start_date: "",
    end_date: "",
  },
];

vi.spyOn(redux, "useSelector").mockImplementation(() => mockCampaigns);
vi.spyOn(redux, "useDispatch").mockReturnValue(vi.fn());

/* ================= TESTS ================= */

describe("Campaigns - Search & Status Filters", () => {

  test("filters campaigns by search input", () => {
    render(<Campaigns />);

    const searchInput = screen.getByPlaceholderText(
      /search by campaign name/i
    );

    fireEvent.change(searchInput, { target: { value: "Summer" } });

    expect(screen.getByText("Summer Sale")).toBeInTheDocument();
    expect(screen.queryByText("Email Blast")).not.toBeInTheDocument();
  });

  test("opens status dropdown", () => {
    render(<Campaigns />);

    fireEvent.click(screen.getByText("All Status"));

    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  test("filters campaigns by selected status", () => {
    render(<Campaigns />);

    fireEvent.click(screen.getByText("All Status"));
    fireEvent.click(screen.getByText("Draft"));

    expect(screen.getByText("Email Blast")).toBeInTheDocument();
    expect(screen.queryByText("Summer Sale")).not.toBeInTheDocument();
  });

});