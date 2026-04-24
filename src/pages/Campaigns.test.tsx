/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import CampaignsScreen from "./Campaigns";

/* ---------------- MOCK CHILD COMPONENTS ---------------- */

vi.mock("../components/Layout/Campaign/CampaignHeader", () => ({
  default: () => <div>CampaignHeader</div>,
}));

vi.mock("../components/Layout/Campaign/CampaignCard", () => ({
  default: ({ campaign }: any) => (
    <div data-testid="campaign-card">{campaign.name}</div>
  ),
}));

vi.mock("../components/Layout/Campaign/AddNewCampaign", () => ({
  default: () => null,
}));

vi.mock("../components/Layout/Campaign/SocialCampaignModal", () => ({
  default: () => null,
}));

vi.mock("../components/Layout/Campaign/EmailCampaignModal", () => ({
  default: () => null,
}));

vi.mock("../components/Layout/Campaign/CampaignDashboard", () => ({
  default: () => null,
}));

vi.mock("../components/Layout/Campaign/EditCampaignModal", () => ({
  default: () => null,
}));

/* ---------------- MOCK REDUX (IMPORTANT FIX) ---------------- */

const mockCampaigns = [
  {
    id: "1",
    campaign_name: "Summer Sale",
    campaign_mode: 1,
    status: "live",
    is_active: true,
  },
  {
    id: "2",
    campaign_name: "Email Blast",
    campaign_mode: 2,
    status: "draft",
    is_active: false,
  },
];

vi.mock("react-redux", async () => {
  const actual: any = await vi.importActual("react-redux");

  return {
    ...actual,
    useDispatch: () => vi.fn(),
    useSelector: () => mockCampaigns,
  };
});

/* ================= TESTS ================= */

describe("Campaigns Component", () => {

  test("renders campaigns", () => {
    render(<CampaignsScreen />);

    expect(screen.getByText("Summer Sale")).toBeInTheDocument();
    expect(screen.getByText("Email Blast")).toBeInTheDocument();
  });

  test("filters campaigns by search", () => {
    render(<CampaignsScreen />);

    const input = screen.getByPlaceholderText(
      /search by campaign name/i
    );

    fireEvent.change(input, { target: { value: "Summer" } });

    expect(screen.getByText("Summer Sale")).toBeInTheDocument();
    expect(screen.queryByText("Email Blast")).not.toBeInTheDocument();
  });

  test("filters campaigns by status", () => {
    render(<CampaignsScreen />);

    fireEvent.click(screen.getByText("All Status"));
    fireEvent.click(screen.getByText("Draft"));

    expect(screen.getByText("Email Blast")).toBeInTheDocument();
    expect(screen.queryByText("Summer Sale")).not.toBeInTheDocument();
  });

  test("filters campaigns by tab", () => {
    render(<CampaignsScreen />);

    fireEvent.click(screen.getByText(/Email Campaigns/i));

    expect(screen.getByText("Email Blast")).toBeInTheDocument();
    expect(screen.queryByText("Summer Sale")).not.toBeInTheDocument();
  });

});