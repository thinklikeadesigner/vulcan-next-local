describe("connect to mongo", () => {
  it("get the best restaurants in town", () => {
    cy.visit("/vn/debug/mongo");
    cy.get(".restaurants li").should("have.length", 5);
  });
});
