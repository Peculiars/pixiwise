import { currentUser } from '@clerk/nextjs/server'; 
import { getUserById } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import { SearchParamProps, TransformationTypeKey } from '../../../../../../types';
import { transformationTypes } from '../../../../../../constants';
import Header from '@/components/shared/Header';
import TransformationForm from '@/components/shared/TransformationForm';

const AddTransformationTypePage = async ({ params }: SearchParamProps) => {
  const { type } = await params;
  const user = await currentUser();
  const userId = user?.id; 
  const transformation = transformationTypes[type];

  if (!userId) redirect('/sign-in'); 

  const dbUser = await getUserById(userId); 
  return (
    <>
      <Header 
        title={transformation.title}
        subtitle={transformation.subTitle}
      />
    
      <section className="mt-10">
        <TransformationForm 
          action="Add"
          userId={dbUser._id} 
          type={transformation.type as TransformationTypeKey}
          creditBalance={dbUser.creditBalance}
        />
      </section>
    </>
  );
};

export default AddTransformationTypePage;