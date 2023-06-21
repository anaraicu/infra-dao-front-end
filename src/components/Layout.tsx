import React from "react";

function Layout(props: any) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="bg-color-main-tertiary flex-1">{props.children}</main>
    </div>
  );
}

export default Layout;
