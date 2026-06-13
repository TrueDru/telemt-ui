import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateUserDialog } from "./create-user-dialog";
import { apiRequest } from "@/lib/telemt/browser";

vi.mock("@/lib/telemt/browser", () => ({
  apiRequest: vi.fn(),
}));

function renderDialog(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <CreateUserDialog instanceId="vps1" open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
  return { onOpenChange };
}

describe("CreateUserDialog", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a validation error for an invalid username and doesn't submit", async () => {
    renderDialog();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Username"), "bad name!");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    expect(await screen.findByText("1-64 chars of [A-Za-z0-9_.-]")).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("generates a 32-hex secret when clicking Generate", async () => {
    renderDialog();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Generate" }));

    const secretInput = screen.getByLabelText("Secret") as HTMLInputElement;
    expect(secretInput.value).toMatch(/^[0-9a-f]{32}$/);
  });

  it("submits a minimal create-user request and closes on success", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      data: { user: { username: "alice" }, secret: "a".repeat(32) },
      revision: "rev-1",
    });
    const { onOpenChange } = renderDialog();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("Username"), "alice");
    await user.click(screen.getByRole("button", { name: "Create user" }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "vps1",
        "/users",
        expect.anything(),
        expect.objectContaining({ method: "POST", body: { username: "alice" } }),
      ),
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
