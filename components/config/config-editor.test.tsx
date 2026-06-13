import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigEditor } from "./config-editor";
import { apiRequest } from "@/lib/telemt/browser";
import { TelemtApiError } from "@/lib/telemt/errors";
import type { ConfigData } from "@/lib/telemt/schemas/config";
import type { TelemtResult } from "@/lib/telemt/client";

vi.mock("@/lib/telemt/browser", () => ({
  apiRequest: vi.fn(),
}));

const INITIAL: TelemtResult<ConfigData> = {
  data: {
    general: { read_only: false, log_level: "info" },
    timeouts: { idle_secs: 60 },
  },
  revision: "rev-1",
};

function renderEditor(initial: TelemtResult<ConfigData> = INITIAL) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <ConfigEditor instanceId="vps1" initial={initial} />
    </QueryClientProvider>,
  );
}

describe("ConfigEditor", () => {
  beforeEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it("saves a dirty field with If-Match and shows the restart notice", async () => {
    vi.mocked(apiRequest).mockResolvedValue({
      data: { revision: "rev-2", restart_required: true, changed: ["general.read_only"] },
      revision: "rev-2",
    });
    renderEditor();
    const user = userEvent.setup();

    await user.click(screen.getByRole("switch"));
    expect(await screen.findByText("Save changes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(apiRequest).toHaveBeenCalledWith(
        "vps1",
        "/config",
        expect.anything(),
        expect.objectContaining({
          method: "PATCH",
          ifMatch: "rev-1",
          body: { general: { read_only: true, log_level: "info" } },
        }),
      ),
    );

    expect(await screen.findByText(/Restart required/)).toBeInTheDocument();
  });

  it("prompts to reload on a revision_conflict error", async () => {
    vi.mocked(apiRequest).mockRejectedValue(
      new TelemtApiError(409, "revision_conflict", "stale revision", "req-1"),
    );
    renderEditor();
    const user = userEvent.setup();

    await user.click(screen.getByRole("switch"));
    await user.click(await screen.findByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Config changed on the server")).toBeInTheDocument();
  });
});
