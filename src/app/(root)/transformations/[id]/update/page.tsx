import { redirect } from "next/navigation";
import Header from "@/components/shared/Header";
import TransformationForm from "@/components/shared/TransformationForm";
import { getUserById } from "@/lib/actions/user.actions";

import { SearchParamProps, TransformationTypeKey } from "../../../../../../types";
import { currentUser } from "@clerk/nextjs/server";
import { getImageById } from "@/lib/actions/image.action";
import { transformationTypes } from "../../../../../../constants";

const Page = async ({ params }: SearchParamProps) => {
  const { id } = await params;
  const userInfo = await currentUser();
    const userId = userInfo?.id; 

  if (!userId) redirect("/sign-in");

  const user = await getUserById(userId);
  const image = await getImageById(id);

  const transformation =
    transformationTypes[image.transformationType as TransformationTypeKey];

  return (
    <>
      <Header title={transformation.title} subtitle={transformation.subTitle} />

      <section className="mt-10">
        <TransformationForm
          action="Update"
          userId={user._id}
          type={image.transformationType as TransformationTypeKey}
          creditBalance={user.creditBalance}
          config={image.config}
          data={image}
        />
      </section>
    </>
  );
};

export default Page;